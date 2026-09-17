async function request(path, options = {}) {
  const token = localStorage.getItem('authToken')
  const response = await fetch(path, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
    ...options,
  })

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(data.error || `Request failed with status ${response.status}`)
  }

  return data
}

export function getPublishedPosts(params = '') {
  return request(`/api/public/posts${params ? `?${params}` : ''}`)
}

export function getCategories() {
  return request('/api/public/categories')
}

export function getPost(slug) {
  return request(`/api/public/posts/slug/${encodeURIComponent(slug)}`)
}

export function getComments(postId) {
  return request(`/api/public/comments/post/${postId}`)
}

export function createComment(payload) {
  return request('/api/public/comments', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function upvoteComment(commentId) {
  return request(`/api/public/comments/${commentId}/upvote`, { method: 'POST' })
}

export function login(payload) {
  return request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function verifySession() {
  return request('/api/auth/verify')
}

export function getAdminPosts(params = '') {
  return request(`/api/posts${params ? `?${params}` : ''}`)
}

export function deletePost(postId) {
  return request(`/api/posts/${postId}`, { method: 'DELETE' })
}
