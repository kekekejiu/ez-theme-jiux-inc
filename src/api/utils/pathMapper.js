

const _pm = [
  ["L2d1ZXN0L2NvbW0vY29uZmln", "/g/conf"],
  ["L3VzZXIvY29tbS9jb25maWc=", "/c/conf"],
  ["L3Bhc3Nwb3J0L2F1dGgvbG9naW4=", "/auth/login"],
  ["L3Bhc3Nwb3J0L2F1dGgvcmVnaXN0ZXI=", "/auth/reg"],
  ["L3Bhc3Nwb3J0L2F1dGgvZm9yZ2V0", "/auth/forget"],
  ["L3Bhc3Nwb3J0L2F1dGgvdG9rZW4yTG9naW4=", "/auth/token2Login"],
  ["L3Bhc3Nwb3J0L2NvbW0vc2VuZEVtYWlsVmVyaWZ5", "/mail/verify"],
  ["L3VzZXIvY2hlY2tMb2dpbg==", "/auth/check"],
  ["L3VzZXIvaW5mbw==", "/u/info"],
  ["L3VzZXIvY2hhbmdlUGFzc3dvcmQ=", "/u/pwd"],
  ["L3VzZXIvcmVzZXRTZWN1cml0eQ==", "/u/reset"],
  ["L3VzZXIvdXBkYXRl", "/u/update"],
  ["L3VzZXIvcmVkZWVtZ2lmdGNhcmQ=", "/u/gift"],
  ["L3VzZXIvZ2V0QWN0aXZlU2Vzc2lvbg==", "/u/session"],
  ["L3VzZXIvZ2V0U3Vic2NyaWJl", "/sub/get"],
  ["L3VzZXIvZ2V0U3RhdA==", "/stat/get"],
  ["L3VzZXIvc3RhdC9nZXRUcmFmZmljTG9n", "/traffic/log"],
  ["L3VzZXIvcGxhbi9mZXRjaA==", "/plan/list"],
  ["L3VzZXIvY291cG9uL2NoZWNr", "/coup/check"],
  ["L3VzZXIvb3JkZXIvc2F2ZQ==", "/order/new"],
  ["L3VzZXIvb3JkZXIvZmV0Y2g=", "/order/list"],
  ["L3VzZXIvb3JkZXIvZGV0YWls", "/order/detail"],
  ["L3VzZXIvb3JkZXIvY2FuY2Vs", "/order/cancel"],
  ["L3VzZXIvb3JkZXIvY2hlY2tvdXQ=", "/order/pay"],
  ["L3VzZXIvb3JkZXIvY2hlY2s=", "/order/check"],
  ["L3VzZXIvb3JkZXIvZ2V0UGF5bWVudE1ldGhvZA==", "/pay/methods"],
  ["L3VzZXIvc2VydmVyL2ZldGNo", "/node/list"],
  ["L3VzZXIvdGlja2V0L2ZldGNo", "/ticket/list"],
  ["L3VzZXIvdGlja2V0L3NhdmU=", "/ticket/new"],
  ["L3VzZXIvdGlja2V0L3JlcGx5", "/ticket/reply"],
  ["L3VzZXIvdGlja2V0L2Nsb3Nl", "/ticket/close"],
  ["L3VzZXIvdGlja2V0L3dpdGhkcmF3", "/withdraw"],
  ["L3VzZXIvaW52aXRlL2ZldGNo", "/inv/info"],
  ["L3VzZXIvaW52aXRlL3NhdmU=", "/inv/new"],
  ["L3VzZXIvaW52aXRlL2RldGFpbHM=", "/inv/detail"],
  ["L3VzZXIvdHJhbnNmZXI=", "/comm/transfer"],
  ["L3VzZXIvbm90aWNlL2ZldGNo", "/notice/list"],
  ["L3VzZXIva25vd2xlZGdlL2ZldGNo", "/knowledge/list"]
];

const pathMappings = _pm.reduce((acc, [k, v]) => {
  acc[(typeof atob === "function" ? atob(k) : Buffer.from(k, "base64").toString())] = v;
  return acc;
}, {});


export function mapApiPath(originalPath) {
  try {
    if (!window.EZ_CONFIG || !window.EZ_CONFIG.API_MIDDLEWARE_ENABLED) {
      return originalPath;
    }
    const [path, query] = originalPath.split("?");
    if (pathMappings[path]) {
      return query ? `${pathMappings[path]}?${query}` : pathMappings[path];
    }
    let matchedPrefix = "";
    let mappedPath = "";
    Object.keys(pathMappings).forEach(prefix => {
      if (path.startsWith(prefix) && prefix.length > matchedPrefix.length) {
        matchedPrefix = prefix;
        mappedPath = pathMappings[prefix];
      }
    });
    if (matchedPrefix) {
      const remainingPath = path.slice(matchedPrefix.length);
      const newPath = mappedPath + remainingPath;
      return query ? `${newPath}?${query}` : newPath;
    }
    return originalPath;
  } catch (error) {
    return originalPath;
  }
}


export function parseQueryParams(url) {
  try {
    const queryString = url.split("?")[1];
    if (!queryString) return {};
    const params = {};
    queryString.split("&").forEach(param => {
      const [key, value] = param.split("=");
      params[key] = decodeURIComponent(value || "");
    });
    return params;
  } catch (error) {
    return {};
  }
}

export default {
  mapApiPath,
  parseQueryParams
};
