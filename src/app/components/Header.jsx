import Link from 'next/link'

const Header = () => {
  return (
    <header className="bg-gray-100 p-4 shadow-md">
      <nav className="flex justify-center gap-4">
        <Link 
          href="/" 
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
        >
          Home
        </Link>
        <Link 
          href="/questoes" 
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
        >
          Questões
        </Link>
        <Link 
          href="/questoes/criar" 
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
        >
          Criar
        </Link>
      </nav>
    </header>
  )
}

export default Header