// 원본 Date 객체를 변경하지 않고 복사본을 만들어 처리 (Mutation 방지)
export const getStartOfWeek = (date: Date): Date => {
  const newDate = new Date(date);
  const day = newDate.getDay();
  // 월요일(1) 기준 계산 (일요일이면 -6, 그 외에는 1-day)
  const diff = newDate.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(newDate.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday;
};

export const formatDateKey = (date: Date): string => {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

export const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};
