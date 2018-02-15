function SignupError (code, error) {
  Error.call(this, error.message);
  Error.captureStackTrace(this, this.constructor);
  this.name = "SignupError";
  this.message = error.message;
  this.code = code;
  this.status = 412;
  this.inner = error;
}

SignupError.prototype = Object.create(Error.prototype);
SignupError.prototype.constructor = SignupError;

module.exports = SignupError;
