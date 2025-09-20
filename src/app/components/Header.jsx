import Link from 'next/link'

const Header = () => {
  return (
    <header className="bg-gray-800 p-4 shadow-md border-b border-gray-700">
      <nav className="flex justify-center gap-4">
        <Link 
          href="/" 
          className="bg-gray-700 text-gray-100 px-4 py-2 rounded hover:bg-gray-600 transition-colors"
        >
          Home
        </Link>
        <Link 
          href="/questoes" 
          className="bg-gray-700 text-gray-100 px-4 py-2 rounded hover:bg-gray-600 transition-colors"
        >
          Questões
        </Link>
        <Link 
          href="/questoes/criar" 
          className="bg-gray-700 text-gray-100 px-4 py-2 rounded hover:bg-gray-600 transition-colors"
        >
          Criar
        </Link>
      </nav>
    </header>
  )
}

export default Header