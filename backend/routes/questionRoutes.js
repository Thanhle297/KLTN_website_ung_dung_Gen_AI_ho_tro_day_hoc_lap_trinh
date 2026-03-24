const express = require("express");
const router = express.Router();
const { getDB } = require("../config/mongodb");
const { ObjectId } = require("mongodb");
const authMiddleware = require("../middleware/authMiddleware");
const teacherOrAdminMiddleware = require("../middleware/teacherOrAdminMiddleware");
const { requireCourseAccess, requireAdmin } = require("../middleware/coursePermission");

/* -------------------- Helper: Get Next ID (Atomic) -------------------- */
async function getNextQuestionId(db) {
  const result = await db
    .collection("counters")
    .findOneAndUpdate(
      { _id: "question_id" },
      { $inc: { seq: 1 } },
      { upsert: true, returnDocument: "after" }
    );

  return result.seq;
}

/* -------------------- Helper: Strip HTML tags -------------------- */
function stripHtml(html) {
  if (!html) return "";
  return html
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/* -------------------- Helper: Tìm hoặc tạo category -------------------- */
async function findOrCreateCategory(db, courseId, categoryName) {
  if (!categoryName) return null;

  const existing = await db.collection("categories").findOne({
    courseId: courseId,
    name: categoryName,
  });

  if (existing) return existing._id;

  // Tạo mới
  const maxOrder = await db
    .collection("categories")
    .find({ courseId })
    .sort({ order: -1 })
    .limit(1)
    .toArray();
  const order = maxOrder.length > 0 ? maxOrder[0].order + 1 : 0;

  const result = await db.collection("categories").insertOne({
    courseId,
    name: categoryName,
    description: "",
    order,
    createdAt: new Date(),
  });
  return result.insertedId;
}

/* ------------ GET All / by lessonId or isBank ------------ */
router.get("/", authMiddleware, async (req, res) => {
  try {
    const { lessonId, isBank, category, courseId, categoryId } = req.query;
    const query = {};

    if (lessonId) query.lessonId = lessonId;

    // Cải thiện filter courseId cho Course Bank
    if (courseId === "null") {
      query.courseId = null; // Chỉ lấy Global Bank
    } else if (courseId) {
      query.courseId = courseId; // Lấy bank của khóa cụ thể
    }
    // Nếu không truyền courseId → lấy tất cả (backward-compatible)

    if (isBank === "true") query.isBank = true;
    if (category) query.category = { $regex: category, $options: "i" };

    // Filter theo categoryId (ObjectId)
    if (categoryId) {
      query.categoryId = new ObjectId(categoryId);
    }

    const list = await getDB()
      .collection("question")
      .find(query)
      .sort({ id: 1 })
      .toArray();

    res.json(list);
  } catch (err) {
    console.error("❌ Lỗi lấy câu hỏi:", err);
    res.status(500).json({ error: err.message });
  }
});

/* ------------ ASSIGN (Clone from Bank) ------------ */
router.post("/assign", authMiddleware, teacherOrAdminMiddleware, async (req, res) => {
  try {
    const { questionIds, targetLessonId, courseId } = req.body;
    const db = getDB();

    const sources = await db
      .collection("question")
      .find({ id: { $in: questionIds } })
      .toArray();

    if (!sources.length) return res.json({ message: "No questions found" });

    // Validate: câu nguồn có courseId → câu đích phải cùng courseId
    // Câu nguồn courseId=null (Global) → chấp nhận mọi courseId đích
    for (const q of sources) {
      if (q.courseId && q.courseId !== courseId) {
        return res.status(400).json({
          message: `Câu hỏi #${q.id} thuộc khóa ${q.courseId}, không thể gán vào khóa ${courseId}`,
        });
      }
    }

    const newDocs = [];

    for (const q of sources) {
      const newId = await getNextQuestionId(db);
      const { _id, id, isBank, ...rest } = q;

      newDocs.push({
        ...rest,
        id: newId,
        lessonId: targetLessonId,
        courseId: courseId, // Gán courseId của khóa học đích
        isBank: false,
      });
    }

    if (newDocs.length) await db.collection("question").insertMany(newDocs);

    res.json({
      message: `Assigned ${newDocs.length} questions`,
      count: newDocs.length,
    });
  } catch (err) {
    console.error("❌ Assign questions error:", err);
    res.status(500).json({ error: err.message });
  }
});

/* ------------ GET one ------------ */
router.get("/:id", authMiddleware, async (req, res) => {
  const doc = await getDB()
    .collection("question")
    .findOne({ id: Number(req.params.id) });

  res.json(doc);
});

/* ------------ CREATE ------------ */
router.post("/", authMiddleware, teacherOrAdminMiddleware, async (req, res) => {
  try {
    const db = getDB();
    const newId = await getNextQuestionId(db);
    const data = { ...req.body, id: newId };

    // Nếu có categoryId (string) → convert sang ObjectId + auto-sync category
    if (data.categoryId) {
      data.categoryId = new ObjectId(data.categoryId);
      // Auto-sync trường category (string) từ categoryId nếu chưa có
      if (!data.category) {
        const cat = await db.collection("categories").findOne({ _id: data.categoryId });
        if (cat) data.category = cat.name;
      }
    }

    await db.collection("question").insertOne(data);

    res.json({ message: "Question created", id: newId });
  } catch (err) {
    console.error("❌ Create question error:", err);
    res.status(500).json({ error: err.message });
  }
});

/* ------------ UPDATE ------------ */
router.put("/:id", authMiddleware, teacherOrAdminMiddleware, async (req, res) => {
  try {
    const db = getDB();
    const data = { ...req.body };
    delete data._id;
    delete data.id; // Cấm update ID

    // Nếu update categoryId → convert sang ObjectId
    if (data.categoryId) {
      data.categoryId = new ObjectId(data.categoryId);

      // Đồng bộ trường category (string) theo tên danh mục
      const cat = await db
        .collection("categories")
        .findOne({ _id: data.categoryId });
      if (cat) {
        data.category = cat.name;
      }
    }

    const result = await db
      .collection("question")
      .updateOne({ id: Number(req.params.id) }, { $set: data });

    res.json({ message: "Question updated", matched: result.matchedCount });
  } catch (err) {
    console.error("❌ Update question error:", err);
    res.status(500).json({ error: err.message });
  }
});

/* ------------ DELETE ------------ */
router.delete("/:id", authMiddleware, teacherOrAdminMiddleware, async (req, res) => {
  await getDB()
    .collection("question")
    .deleteOne({ id: Number(req.params.id) });

  res.json({ message: "Question deleted" });
});

/* ------------ REORDER QUESTIONS ------------ */
router.put("/reorder/batch", authMiddleware, teacherOrAdminMiddleware, async (req, res) => {
  try {
    const { questionIds } = req.body;

    if (!Array.isArray(questionIds)) {
      return res.status(400).json({
        message: "Thiếu questionIds",
      });
    }

    const db = getDB();
    const bulkOps = questionIds.map((qId, index) => ({
      updateOne: {
        filter: { id: Number(qId) },
        update: { $set: { order: index } },
      },
    }));

    if (bulkOps.length > 0) {
      await db.collection("question").bulkWrite(bulkOps);
    }

    res.json({
      message: "Cập nhật thứ tự câu hỏi thành công",
      count: bulkOps.length,
    });
  } catch (err) {
    console.error("❌ Reorder questions error:", err);
    res.status(500).json({ error: err.message });
  }
});

/* ==========================================================================
   ENDPOINTS MỚI: Import / Copy / Promote
========================================================================== */

/* ------------ IMPORT: Global Bank → Course Bank ------------ */
router.post(
  "/import-to-course",
  authMiddleware,
  requireCourseAccess,
  async (req, res) => {
    try {
      const { questionIds, targetCourseId } = req.body;
      const db = getDB();

      if (!questionIds || !questionIds.length) {
        return res.status(400).json({ message: "Thiếu danh sách câu hỏi" });
      }
      if (!targetCourseId) {
        return res.status(400).json({ message: "Thiếu khóa học đích" });
      }

      // Fetch câu hỏi gốc từ Global Bank
      const sources = await db
        .collection("question")
        .find({ id: { $in: questionIds }, isBank: true, courseId: null })
        .toArray();

      // Kiểm tra thiếu câu nào
      const foundIds = new Set(sources.map((q) => q.id));
      const missing = questionIds.filter((qId) => !foundIds.has(qId));
      if (missing.length > 0) {
        return res.status(400).json({
          message: `Không tìm thấy câu hỏi #${missing.join(", #")} trong ngân hàng chung`,
        });
      }

      let categoriesCreated = 0;
      const newDocs = [];

      for (const q of sources) {
        const newId = await getNextQuestionId(db);
        const { _id, id, isBank, order, ...rest } = q;

        // Auto-map category
        let mappedCategoryId = null;
        if (q.category) {
          const existingCat = await db.collection("categories").findOne({
            courseId: targetCourseId,
            name: q.category,
          });
          if (existingCat) {
            mappedCategoryId = existingCat._id;
          } else {
            // Tạo category mới cho khóa đích
            mappedCategoryId = await findOrCreateCategory(
              db,
              targetCourseId,
              q.category
            );
            categoriesCreated++;
          }
        }

        newDocs.push({
          ...rest,
          id: newId,
          courseId: targetCourseId,
          lessonId: null,
          isBank: true,
          categoryId: mappedCategoryId,
          category: q.category || null,
          order: null,
        });
      }

      if (newDocs.length) {
        await db.collection("question").insertMany(newDocs);
      }

      res.json({
        message: "Import thành công",
        imported: newDocs.length,
        categoriesCreated,
        questions: newDocs.map((q) => ({ id: q.id, category: q.category })),
      });
    } catch (err) {
      console.error("❌ Import to course error:", err);
      res.status(500).json({ message: "Lỗi server", error: err.message });
    }
  }
);

/* ------------ COPY: Course Bank A → Course Bank B ------------ */
router.post(
  "/copy-between-courses",
  authMiddleware,
  requireCourseAccess,
  async (req, res) => {
    try {
      const {
        questionIds,
        sourceCourseId,
        targetCourseId,
        copyCategories = true,
      } = req.body;
      const db = getDB();

      // Validate
      if (!questionIds || !questionIds.length) {
        return res.status(400).json({ message: "Thiếu danh sách câu hỏi" });
      }
      if (sourceCourseId === targetCourseId) {
        return res
          .status(400)
          .json({ message: "Khóa nguồn và khóa đích không được trùng nhau" });
      }

      // Fetch câu hỏi nguồn
      const sources = await db
        .collection("question")
        .find({
          id: { $in: questionIds },
          isBank: true,
          courseId: sourceCourseId,
        })
        .toArray();

      if (!sources.length) {
        return res
          .status(400)
          .json({ message: "Không tìm thấy câu hỏi trong khóa nguồn" });
      }

      // Xây map categoryId nếu copyCategories
      const categoryMap = new Map(); // sourceCategoryId.toString() → targetCategoryId
      let categoriesCreated = 0;

      if (copyCategories) {
        // Thu thập unique categoryId từ câu hỏi nguồn
        const uniqueCatIds = [
          ...new Set(
            sources
              .filter((q) => q.categoryId)
              .map((q) => q.categoryId.toString())
          ),
        ];

        if (uniqueCatIds.length > 0) {
          // Fetch category documents nguồn
          const sourceCats = await db
            .collection("categories")
            .find({
              _id: { $in: uniqueCatIds.map((id) => new ObjectId(id)) },
            })
            .toArray();

          for (const srcCat of sourceCats) {
            // Tìm/tạo category ở khóa đích
            const targetCat = await db.collection("categories").findOne({
              courseId: targetCourseId,
              name: srcCat.name,
            });

            if (targetCat) {
              categoryMap.set(srcCat._id.toString(), targetCat._id);
            } else {
              const newCatId = await findOrCreateCategory(
                db,
                targetCourseId,
                srcCat.name
              );
              categoryMap.set(srcCat._id.toString(), newCatId);
              categoriesCreated++;
            }
          }
        }
      }

      // Tạo bản sao
      const newDocs = [];
      for (const q of sources) {
        const newId = await getNextQuestionId(db);
        const { _id, id, isBank, order, ...rest } = q;

        // Map categoryId
        let mappedCategoryId = null;
        if (q.categoryId && categoryMap.has(q.categoryId.toString())) {
          mappedCategoryId = categoryMap.get(q.categoryId.toString());
        }

        newDocs.push({
          ...rest,
          id: newId,
          courseId: targetCourseId,
          isBank: true,
          categoryId: mappedCategoryId,
          order: null,
        });
      }

      if (newDocs.length) {
        await db.collection("question").insertMany(newDocs);
      }

      res.json({
        message: "Sao chép thành công",
        copied: newDocs.length,
        categoriesCreated,
      });
    } catch (err) {
      console.error("❌ Copy between courses error:", err);
      res.status(500).json({ message: "Lỗi server", error: err.message });
    }
  }
);

/* ------------ PROMOTE: Course Bank → Global Bank ------------ */
router.post(
  "/promote-to-global",
  authMiddleware,
  requireAdmin,
  async (req, res) => {
    try {
      const {
        questionIds,
        sourceCourseId,
        skipDuplicateCheck = false,
      } = req.body;
      const db = getDB();

      if (!questionIds || !questionIds.length) {
        return res.status(400).json({ message: "Thiếu danh sách câu hỏi" });
      }

      // Fetch câu hỏi nguồn
      const sources = await db
        .collection("question")
        .find({
          id: { $in: questionIds },
          isBank: true,
          courseId: sourceCourseId,
        })
        .toArray();

      if (!sources.length) {
        return res
          .status(400)
          .json({ message: "Không tìm thấy câu hỏi trong khóa nguồn" });
      }

      // Duplicate check
      let duplicateMap = new Map(); // sourceId → { isDuplicate, duplicateOf }
      if (!skipDuplicateCheck) {
        // Lấy tất cả câu Global Bank
        const globalQuestions = await db
          .collection("question")
          .find({ isBank: true, courseId: null })
          .project({ id: 1, question: 1 })
          .toArray();

        const globalPlainTexts = globalQuestions.map((gq) => ({
          id: gq.id,
          plainText: stripHtml(gq.question),
        }));

        for (const q of sources) {
          const sourcePlain = stripHtml(q.question);
          const match = globalPlainTexts.find(
            (gq) => gq.plainText === sourcePlain && sourcePlain.length > 0
          );
          if (match) {
            duplicateMap.set(q.id, {
              isDuplicate: true,
              duplicateOf: match.id,
            });
          }
        }
      }

      // Phân loại: safe vs warning
      const results = [];
      const safeSources = [];

      for (const q of sources) {
        const dupInfo = duplicateMap.get(q.id);
        if (dupInfo && dupInfo.isDuplicate) {
          results.push({
            sourceId: q.id,
            newGlobalId: null,
            status: "duplicate_warning",
            duplicateOf: dupInfo.duplicateOf,
            message: `Nội dung tương tự câu #${dupInfo.duplicateOf} trong ngân hàng chung`,
          });
        } else {
          safeSources.push(q);
        }
      }

      // Copy các câu safe
      const newDocs = [];
      for (const q of safeSources) {
        const newId = await getNextQuestionId(db);
        const { _id, id, isBank, order, courseId, ...rest } = q;

        // Auto-map category sang global
        let globalCategoryId = null;
        if (q.category) {
          globalCategoryId = await findOrCreateCategory(db, null, q.category);
        }

        const doc = {
          ...rest,
          id: newId,
          courseId: null,
          lessonId: null,
          isBank: true,
          categoryId: globalCategoryId,
          category: q.category || null,
          order: null,
        };
        newDocs.push(doc);

        results.push({
          sourceId: q.id,
          newGlobalId: newId,
          status: "created",
        });
      }

      if (newDocs.length) {
        await db.collection("question").insertMany(newDocs);
      }

      res.json({
        promoted: results,
        totalCreated: newDocs.length,
        totalWarnings: results.filter((r) => r.status === "duplicate_warning")
          .length,
      });
    } catch (err) {
      console.error("❌ Promote to global error:", err);
      res.status(500).json({ message: "Lỗi server", error: err.message });
    }
  }
);

module.exports = router;
