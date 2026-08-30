import { Link } from 'react-router-dom'
import { appName } from '../config/app'


export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <p>
          © {new Date().getFullYear()}{' '}
          <Link to="/" className="footer-link">{appName}</Link> — SMIT AI Factory 2.0 Hackathon.
        </p>
      </div>
    </footer>
  )
}