# =====================================================
# Pydantic request models
# =====================================================
from pydantic import BaseModel
from typing import List


class TestCase(BaseModel):
    input: str
    expected: str


class CodeRequest(BaseModel):
    code: str
    testcases: List[TestCase]
    echo_input: bool = False


class SimpleCodeRequest(BaseModel):
    code: str
    input: str = ""
    echo_input: bool = True
