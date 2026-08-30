import {
  LayoutDashboard,
  Tickets,
  PlusCircle,
  User,
  Inbox,
  CheckCircle,
  Activity,
  Layers,
  MessageSquare,
  FileText,
  Sparkles,
  LifeBuoy,
  LogOut,
  ChevronLeft,
  Menu,
  X,
  AlertTriangle,
  Loader2,
  Search,
  Users,
  UserCheck,
  Shield,
  ToggleRight,
  Database,
} from 'lucide-react'


const ICONS = {
  Dashboard: LayoutDashboard,
  Tickets,
  PlusCircle,
  User,
  Inbox,
  CheckCircle,
  Activity,
  Layers,
  MessageSquare,
  FileText,
  Sparkles,
  LifeBuoy,
  LogOut,
  ChevronLeft,
  Menu,
  X,
  AlertTriangle,
  Loader2,
  Search,
  Users,
  UserCheck,
  Shield,
  ToggleRight,
  Database,
}


export default function AppIcon({ name = 'FileText', size = 18, className }) {
  const Icon = ICONS[name] || FileText
  return <Icon size={size} className={className} />
}