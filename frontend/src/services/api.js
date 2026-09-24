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

export function sendContactMessage(payload) {
  return request('/api/public/contact', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function getCategories() {
  return request('/api/public/categories')
}

export function getStudyTopics() {
  return request('/api/public/categories?type=STUDY')
}

export function getStudyGuide() {
  return request('/api/public/study-guide')
}

export function getGuestQuestionAvailability() {
  return request('/api/public/question-preview/availability')
}

export function startGuestQuestionPreview(payload) {
  return request('/api/public/question-preview/start', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function submitGuestQuestionAnswer(payload) {
  return request('/api/public/question-preview/answer', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function getStudyDomains() { return request('/api/study-content/domains') }
export function createStudyDomain(payload) { return request('/api/study-content/domains', { method: 'POST', body: JSON.stringify(payload) }) }
export function updateStudyDomain(id, payload) { return request(`/api/study-content/domains/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }) }
export function deleteStudyDomain(id) { return request(`/api/study-content/domains/${id}`, { method: 'DELETE' }) }
export function createStudyModule(payload) { return request('/api/study-content/modules', { method: 'POST', body: JSON.stringify(payload) }) }
export function updateStudyModule(id, payload) { return request(`/api/study-content/modules/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }) }
export function deleteStudyModule(id) { return request(`/api/study-content/modules/${id}`, { method: 'DELETE' }) }

export function getAdminCategories(type = '') {
  return request(`/api/categories${type ? `?type=${encodeURIComponent(type)}` : ''}`)
}

export function createCategory(payload) {
  return request('/api/categories', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function updateCategory(categoryId, payload) {
  return request(`/api/categories/${categoryId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export function deleteCategory(categoryId) {
  return request(`/api/categories/${categoryId}`, { method: 'DELETE' })
}

export async function uploadImage(file) {
  const body = new FormData()
  body.append('image', file)
  const response = await fetch('/api/upload', {
    method: 'POST',
    headers: { Authorization: `Bearer ${localStorage.getItem('authToken') || ''}` },
    body,
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data.error || 'Image upload failed')
  return data.file
}

export async function uploadQuestionImage(file) {
  const body = new FormData()
  body.append('image', file)
  const response = await fetch('/api/question-images', {
    method: 'POST',
    headers: { Authorization: `Bearer ${localStorage.getItem('authToken') || ''}` },
    body,
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data.error || 'Question image upload failed')
  return data.image
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

export function requestPasswordReset(accountType, email) {
  const prefix = accountType === 'student' ? '/api/student/auth' : '/api/auth'
  return request(`${prefix}/password-reset/request`, {
    method: 'POST',
    body: JSON.stringify({ email }),
  })
}

export function completePasswordReset(accountType, email, code, password) {
  const prefix = accountType === 'student' ? '/api/student/auth' : '/api/auth'
  return request(`${prefix}/password-reset/complete`, {
    method: 'POST',
    body: JSON.stringify({ email, code, password }),
  })
}

export function getAdminPosts(params = '') {
  return request(`/api/posts${params ? `?${params}` : ''}`)
}

export function createPost(payload) {
  return request('/api/posts', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
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

export function getQuestions(params = '') {
  return request(`/api/questions${params ? `?${params}` : ''}`)
}

export function createQuestion(payload) {
  return request('/api/questions', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function updateQuestion(questionId, payload) {
  return request(`/api/questions/${questionId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export function archiveQuestion(questionId) {
  return request(`/api/questions/${questionId}`, { method: 'DELETE' })
}

export function importQuestions(questions) {
  return request('/api/questions/import', {
    method: 'POST',
    body: JSON.stringify({ questions }),
  })
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

export function deleteExamSession(sessionId) {
  return request(`/api/exam-sessions/${sessionId}`, {
    method: 'DELETE',
    tokenType: 'student',
  })
}

export function getStudentPerformance() {
  return request('/api/exam-sessions/performance', { tokenType: 'student' })
}

export function getQuestionAvailability() {
  return request('/api/exam-sessions/availability', { tokenType: 'student' })
}
