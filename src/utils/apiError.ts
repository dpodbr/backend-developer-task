const commonErrors: { [code: number]: string } = {
  500: 'Internal server error.',
  404: 'Not found.',
  403: 'Forbidden.',
  400: 'Bad request.',
  401: 'Invalid authorization.'
};

export class APIError extends Error {
  public code: number;

  constructor(code: number, message?: string) {
    const reason: string = message ?? commonErrors[code] ?? 'Unknown error.';
    super(reason);

    this.code = code;
  }
}
