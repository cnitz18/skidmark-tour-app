function msToTime(s) {
    // Pad to 2 or 3 digits, default is 2
    function pad(n, z) {
      z = z || 2;
      return ('00' + n).slice(-z);
    }
  
    var ms = s % 1000;
    s = (s - ms) / 1000;
    var secs = s % 60;
    s = (s - secs) / 60;
    var mins = s % 60;
    var hrs = (s - mins) / 60;
    var str = pad(secs) + '.' + pad(ms, 3);
    if( mins )
      str = pad(mins) + ':' + str;
    else if( hrs )
      str = pad(hrs) + ':' + str;
    return str;
  }
export default msToTime;