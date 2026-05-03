import React from "react";
import SubmissionHistoryModal from "../../SubmissionHistoryModal";

const SubmissionHistoryDialog = ({ target, courseId, onClose }) => {
  if (!target) return null;

  return (
    <SubmissionHistoryModal
      userId={target.userId}
      subLessonId={target.subLessonId}
      onClose={onClose}
      from="admin"
      courseId={courseId}
    />
  );
};

SubmissionHistoryDialog.displayName = "SubmissionHistoryDialog";

export default React.memo(SubmissionHistoryDialog);
