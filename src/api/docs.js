import { buildKnowledgeList, getKnowledgeDetail } from '@/config/knowledgeData';

// 静态化：教程内容已内置到 src/config/knowledgeData.js，不再请求后端 API。
// 如需恢复走后端接口，可还原本文件为原来的 request 调用。

export function fetchKnowledgeList(language) {
  return Promise.resolve({ data: buildKnowledgeList(language) });
}


export function fetchKnowledgeDetail(id, language) {
  const detail = getKnowledgeDetail(id);
  if (detail) {
    return Promise.resolve({ data: detail });
  }
  return Promise.reject(new Error('Document not found'));
}
