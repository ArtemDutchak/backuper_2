
export default {
  isJson(str) {
      try {
          JSON.parse(str);
      } catch (e) {
          return false;
      }
      return true;
  },
  delay(timeout){
    return new Promise((resolve) => {
      setTimeout(resolve, timeout);
    });
  },
  get_date(d = false){
    if (!d) {
      d = new Date().getTime()
    }
    const today = new Date(d);
    const year = today.getFullYear();
    let month = today.getMonth() + 1;
    let day = today.getDate();
    let hours = today.getHours();
    let minutes = today.getMinutes();
    let seconds = today.getSeconds();

    if (month < 10) {
      month = '0' + month;
    }
    if (day < 10) {
      day = '0' + day;
    }
    if (hours < 10) {
      hours = '0' + hours;
    }
    if (minutes < 10) {
      minutes = '0' + minutes;
    }
    if (seconds < 10) {
      seconds = '0' + seconds;
    }

    return `${hours}:${minutes}:${seconds}  ${day}.${month}.${year}`
  },
  now_time(){
    const today = new Date();
    let hours = today.getHours();
    let minutes = today.getMinutes();
    if (hours < 10) {
      hours = '0' + hours
    }
    if (minutes < 10) {
      minutes = '0' + minutes
    }
    return `${hours}:${minutes}`
  },
  get_file_date(){
    const d = new Date();
    let str = this.get_date()
    str = str.replace(' ','_').replace(/:/g,'.')
    return str
  }
}
