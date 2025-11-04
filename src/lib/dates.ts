export const startOfDay = (d=new Date()) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
export const addMinutes = (d:Date, m:number) => new Date(d.getTime()+m*60000);
