async function request(path, options = {}) {
  const { tokenType = 'admin', ...fetchOptions } = options
  const tokenKey = tokenType === 'student' ? 'studentToken' : 'authToken'
  const token = localStorage.getItem(tokenKey)
  const response = await fetch(path, {
    ...fetchOptions,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...fetchOptions.headers,
    },
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

export function getStudents() {
  return request('/api/students')
}

export function createStudent(payload) {
  return request('/api/students', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function updateStudent(studentId, payload) {
  return request(`/api/students/${studentId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export function resetStudentPassword(studentId, password) {
  return request(`/api/students/${studentId}/reset-password`, {
    method: 'POST',
    body: JSON.stringify({ password }),
  })
}

export function deleteStudent(studentId) {
  return request(`/api/students/${studentId}`, { method: 'DELETE' })
}

export function studentLogin(payload) {
  return request('/api/student/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
    tokenType: 'student',
  })
}

export function verifyStudentSession() {
  return request('/api/student/auth/verify', { tokenType: 'student' })
}

export function startExamSession(payload) {
  return request('/api/exam-sessions', {
    method: 'POST',
    body: JSON.stringify(payload),
    tokenType: 'student',
  })
}

export function getExamSession(sessionId) {
  return request(`/api/exam-sessions/${sessionId}`, { tokenType: 'student' })
}

export function submitExamAnswer(sessionId, payload) {
  return request(`/api/exam-sessions/${sessionId}/answers`, {
    method: 'POST',
    body: JSON.stringify(payload),
    tokenType: 'student',
  })
}

export function finalizeExamSession(sessionId) {
  return request(`/api/exam-sessions/${sessionId}/finalize`, {
    method: 'POST',
    tokenType: 'student',
  })
}

export function getStudentHistory() {
  return request('/api/exam-sessions/history', { tokenType: 'student' })
}

export function getStudentPerformance() {
  return request('/api/exam-sessions/performance', { tokenType: 'student' })
}
