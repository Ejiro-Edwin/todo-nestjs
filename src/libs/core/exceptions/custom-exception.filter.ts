import { ExceptionFilter, Catch, HttpStatus } from '@nestjs/common';
import { HttpException } from '@nestjs/core';
import { ValidationError } from 'class-validator';
import { JsonWebTokenError } from 'jsonwebtoken';
import { CustomValidationError } from './custom-validation.error';
import { CustomError } from './custom.error';
import { QueryFailedError } from 'typeorm';

@Catch(SyntaxError, CustomValidationError, CustomError, JsonWebTokenError, QueryFailedError)
export class CustomExceptionFilter implements ExceptionFilter {
    constructor(
        private _indexFile?: string
    ) {

    }
    badRequest(response, data: Object) {
        // todo: refactor after update nest to 5 version
        if (
            response.req.originalUrl.indexOf('/api/') !== 0 &&
            response.req.accepts('html') &&
            this._indexFile
        ) {
            response.sendFile(this._indexFile);
        } else {
            response.status(HttpStatus.BAD_REQUEST).json(data);
        }
    }
    catch(exception: CustomValidationError | JsonWebTokenError | SyntaxError | QueryFailedError, response) {
        const errors = {};
        if (exception instanceof CustomValidationError) {
            if (process.env.DEBUG === 'true') {
                this.badRequest(response, exception);
                return;
            }
            exception.errors.forEach((error: ValidationError) => {
                Object.keys(error.constraints).forEach(
                    (key: string) => {
                        if (!errors[error.property]) {
                            errors[error.property] = [];
                        }
                        errors[error.property].push(error.constraints[key]);
                    }
                );
            });
            this.badRequest(response, { validationErrors: errors });
            return;
        }
        if (exception instanceof QueryFailedError) {
            if (process.env.DEBUG === 'true') {
                this.badRequest(response, exception);
                return;
            }
            this.badRequest(response, {
                message: exception.message
            });
            return;
        }
        if (exception instanceof JsonWebTokenError) {
            if (process.env.DEBUG === 'true') {
                this.badRequest(response, exception);
                return;
            }
            this.badRequest(response, {
                message: 'Invalid token'
            });
            return;
        }
        if (exception instanceof CustomError) {
            if (process.env.DEBUG === 'true') {
                this.badRequest(response, exception);
                return;
            }
            this.badRequest(response, {
                message: exception.message
            });
            return;
        }
        if (exception instanceof SyntaxError) {
            if (process.env.DEBUG === 'true') {
                this.badRequest(response, exception);
                return;
            }
            this.badRequest(response, {
                message: exception.message ? exception.message : String(exception)
            });
            return;
        }
    }
}