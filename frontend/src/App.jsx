import AboutPage from './pages/AboutPage'
import AdminPage from './pages/AdminPage'
import ArticlePage from './pages/ArticlePage'
import BlogPage from './pages/BlogPage'
import ContactPage from './pages/ContactPage'
import DashboardPage from './pages/DashboardPage'
import DiagnosticPage from './pages/DiagnosticPage'
import HomePage from './pages/HomePage'
import QuestionBankPage from './pages/QuestionBankPage'
import StudentAreaPage from './pages/StudentAreaPage'
import StudyGuidePage from './pages/StudyGuidePage'
import './App.css'

const routes = {
  '/': HomePage,
  '/index': HomePage,
  '/study-guide': StudyGuidePage,
  '/studyguide': StudyGuidePage,
  '/question-bank': QuestionBankPage,
  '/student-area': StudentAreaPage,
  '/blog': BlogPage,
  '/bloglisting': BlogPage,
  '/post': ArticlePage,
  '/about': AboutPage,
  '/contact': ContactPage,
  '/admin': AdminPage,
  '/dashboard': DashboardPage,
  '/diagnostic': DiagnosticPage,
}

export default function App() {
  const path = window.location.pathname.replace(/\.html$/, '')
  const Page = routes[path] || HomePage
  return <Page />
}
