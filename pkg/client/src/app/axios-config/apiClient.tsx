import axios, { AxiosPromise } from "axios";

export class APIClient {
  public static request<T>(
    path: string,
    body: any = null,
    method:
      | "get"
      | "post"
      | "put"
      | "delete"
      | "options"
      | "patch"
      | undefined = "get",
    config = {}
  ): AxiosPromise<T> {
    return axios.request<T>(
      Object.assign(
        {},
        {
          url: path,
          method,
          data: body,
        },
        config
      )
    );
  }

  public static post<T>(path: string, body: any, config = {}): AxiosPromise<T> {
    return this.request<T>(path, body, "post", config);
  }

  public static put<T>(path: string, body: any, config = {}): AxiosPromise<T> {
    return this.request<T>(path, body, "put", config);
  }

  public static patch<T>(
    path: string,
    body: any,
    config = {}
  ): AxiosPromise<T> {
    return this.request<T>(path, body, "patch", config);
  }

  public static get<T>(path: string, config = {}): AxiosPromise<T> {
    return this.request<T>(path, null, "get", config);
  }

  public static delete(path: string, config = {}) {
    return this.request(path, null, "delete", config);
  }
}
