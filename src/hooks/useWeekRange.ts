export default function useWeekRange(startOnMonday=true){
  const now=new Date();
  const d=new Date(now);
  const day=(now.getDay()+6)%7; // Mon=0
  const diff=startOnMonday?day:now.getDay();
  const start=new Date(d.setDate(now.getDate()-diff)); start.setHours(0,0,0,0);
  const end=new Date(start); end.setDate(start.getDate()+7);
  return { start, end };
}
