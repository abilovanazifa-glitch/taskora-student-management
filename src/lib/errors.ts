export class AppError extends Error {
  constructor(
    public code: string,
    message?: string,
  ) {
    super(message ?? code);
    this.name = "AppError";
  }
}

export class UnauthorizedError extends AppError {
  constructor() {
    super("unauthorized");
  }
}

export class ForbiddenError extends AppError {
  constructor() {
    super("forbidden");
  }
}

export class NotFoundError extends AppError {
  constructor() {
    super("notFound");
  }
}
