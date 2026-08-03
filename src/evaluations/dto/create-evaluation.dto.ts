export class CreateEvaluationDto {
  studentId: string;          // นักเรียน
  adminId: string;            // ครู/ผู้สอน
  subjectId?: string;         // วิชาที่กำลังสอน
  classId?: string;           // ห้องเรียนที่กำลังสอน
  subjectEvaluationId?: string; // optional เชื่อมกับหัวข้อ evaluation
  score: number;              // คะแนน
  contentIndex?: number;      // index ใน subjectEvaluation.contents[] (default 0)
}
