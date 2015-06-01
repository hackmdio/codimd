(function() {
  var Idle;

  /** IE8/old browser support **/
  if (!document.addEventListener) {
    if (document.attachEvent) {
      document.addEventListener = function(event, callback, useCapture) {
        return document.attachEvent("on" + event, callback, useCapture);
      };
    } else {
      document.addEventListener = function() {
        return {};
      };
    }
  }

  if (!document.removeEventListener) {
    if (document.detachEvent) {
      document.removeEventListener = function(event, callback) {
        return document.detachEvent("on" + event, callback);
      };
    } else {
      document.removeEventListener = function() {
        return {};
      };
    }
  }

  "use strict";

  Idle = {};

  Idle = (function() {
    Idle.isAway = false;

    Idle.awayTimeout = 3000;

    Idle.awayTimestamp = 0;

    Idle.awayTimer = null;

    Idle.onAway = null;

    Idle.onAwayBack = null;

    Idle.onVisible = null;

    Idle.onHidden = null;

    function Idle(options) {
      var activeMethod, activity;
      if (options) {
        this.awayTimeout = parseInt(options.awayTimeout, 10);
        this.onAway = options.onAway;
        this.onAwayBack = options.onAwayBack;
        this.onVisible = options.onVisible;
        this.onHidden = options.onHidden;
      }
      activity = this;
      activeMethod = function() {
        return activity.onActive();
      };
      window.onclick = activeMethod;
      window.onmousemove = activeMethod;
      window.onmouseenter = activeMethod;
      window.onkeydown = activeMethod;
      window.onscroll = activeMethod;
      window.onmousewheel = activeMethod;
    }

    Idle.prototype.onActive = function() {
      this.awayTimestamp = new Date().getTime() + this.awayTimeout;
      if (this.isAway) {
        this.isAway = false;
        if (this.onAwayBack) {
          this.onAwayBack();
        }
        this.start();
      }
      return true;
    };

    Idle.prototype.start = function() {
      var activity;
      if (!this.listener) {
        this.listener = (function() {
          return activity.handleVisibilityChange();
        });
        document.addEventListener("visibilitychange", this.listener, false);
        document.addEventListener("webkitvisibilitychange", this.listener, false);
        document.addEventListener("msvisibilitychange", this.listener, false);
      }
      this.awayTimestamp = new Date().getTime() + this.awayTimeout;
      if (this.awayTimer !== null) {
        clearTimeout(this.awayTimer);
      }
      activity = this;
      this.awayTimer = setTimeout((function() {
        return activity.checkAway();
      }), this.awayTimeout + 100);
      return this;
    };

    Idle.prototype.stop = function() {
      if (this.awayTimer !== null) {
        clearTimeout(this.awayTimer);
      }
      if (this.listener !== null) {
        document.removeEventListener("visibilitychange", this.listener);
        document.removeEventListener("webkitvisibilitychange", this.listener);
        document.removeEventListener("msvisibilitychange", this.listener);
        this.listener = null;
      }
      return this;
    };

    Idle.prototype.setAwayTimeout = function(ms) {
      this.awayTimeout = parseInt(ms, 10);
      return this;
    };

    Idle.prototype.checkAway = function() {
      var activity, t;
      t = new Date().getTime();
      if (t < this.awayTimestamp) {
        this.isAway = false;
        activity = this;
        this.awayTimer = setTimeout((function() {
          return activity.checkAway();
        }), this.awayTimestamp - t + 100);
        return;
      }
      if (this.awayTimer !== null) {
        clearTimeout(this.awayTimer);
      }
      this.isAway = true;
      if (this.onAway) {
        return this.onAway();
      }
    };

    Idle.prototype.handleVisibilityChange = function() {
      if (document.hidden || document.msHidden || document.webkitHidden) {
        if (this.onHidden) {
          return this.onHidden();
        }
      } else {
        if (this.onVisible) {
          return this.onVisible();
        }
      }
    };

    return Idle;

  })();

  window.Idle = Idle;

}).call(this);
