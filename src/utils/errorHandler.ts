class ErrorHandler extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;

    // Capture the stack trace for better debugging
    Error.captureStackTrace(this, this.constructor);
  }
}

export default ErrorHandler;
