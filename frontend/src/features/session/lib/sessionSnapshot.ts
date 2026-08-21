import { Features, Profile } from "@bindings/internal/session/service";

function loadSessionSnapshot() {
  return Promise.all([Profile(), Features()]);
}

let activeRequest: ReturnType<typeof loadSessionSnapshot> | null = null;

// Share concurrent initialization requests, including React Strict Mode's
// development-only second effect run.
export function sessionSnapshot() {
  if (activeRequest) return activeRequest;

  const request = loadSessionSnapshot();
  activeRequest = request;
  const clearRequest = () => {
    if (activeRequest === request) activeRequest = null;
  };
  void request.then(clearRequest, clearRequest);
  return request;
}
