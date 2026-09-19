import AboutPage from './pages/AboutPage';
import AdminPage from './pages/AdminPage';
import ArticlePage from './pages/ArticlePage';
import BlogPage from './pages/BlogPage';
import ContactPage from './pages/ContactPage';
import DashboardPage from './pages/DashboardPage';
import DiagnosticPage from './pages/DiagnosticPage';
import HomePage from './pages/HomePage';
import QuestionBankPage from './pages/QuestionBankPage';
import StudentAreaPage from './pages/StudentAreaPage';
import StudySessionPage from './pages/StudySessionPage';
import StudyGuidePage from './pages/StudyGuidePage';
import FaqPage from './pages/FaqPage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import PricingPage from './pages/PricingPage';
import NotFoundPage from './pages/NotFoundPage';
import './App.css';

const routes = {
  '/': HomePage,
  '/index': HomePage,
  '/study-guide': StudyGuidePage,
  '/studyguide': StudyGuidePage,
  '/question-bank': QuestionBankPage,
  '/student-area': StudentAreaPage,
  '/study-session': StudySessionPage,
  '/blog': BlogPage,
  '/bloglisting': BlogPage,
  '/post': ArticlePage,
  '/about': AboutPage,
  '/contact': ContactPage,
  '/admin': AdminPage,
  '/dashboard': DashboardPage,
  '/diagnostic': DiagnosticPage,
  '/faq': FaqPage,
  '/privacy': PrivacyPolicyPage,
  '/privacy-policy': PrivacyPolicyPage,
  '/pricing': PricingPage,
};

export default function App() {
  const path = window.location.pathname.replace(/\.html$/, '');
  const Page = routes[path] || NotFoundPage;
  return <Page />;
}
