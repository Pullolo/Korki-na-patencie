import {
  Atom,
  BookOpen,
  Braces,
  Calculator,
  FlaskConical,
  Globe,
  Landmark,
  Languages,
  Leaf,
  Music,
  Sigma,
} from "lucide-react"

/**
 * Ikona przedmiotu. Panel trzyma w `Subject.icon` nazwę ikony lucide, ale
 * przedmiot założony bez ikony też musi się wyświetlić — dlatego mapa po
 * slugu i sensowna wartość domyślna. Ikony są w jednej wadze i jednym
 * rozmiarze na kontekst (`DESIGN.md`, Do's).
 *
 * Mapy trzymają funkcje rysujące, nie same komponenty: komponent wybrany
 * dynamicznie w trakcie renderu jest dla kompilatora Reacta nowym typem
 * i gubiłby stan przy każdym przerysowaniu.
 */

type IconProps = { className?: string }
type IconRenderer = (props: IconProps) => React.ReactElement

const BY_NAME: Record<string, IconRenderer> = {
  sigma: (props) => <Sigma {...props} />,
  calculator: (props) => <Calculator {...props} />,
  atom: (props) => <Atom {...props} />,
  braces: (props) => <Braces {...props} />,
  flask: (props) => <FlaskConical {...props} />,
  "flask-conical": (props) => <FlaskConical {...props} />,
  leaf: (props) => <Leaf {...props} />,
  languages: (props) => <Languages {...props} />,
  globe: (props) => <Globe {...props} />,
  landmark: (props) => <Landmark {...props} />,
  music: (props) => <Music {...props} />,
  book: (props) => <BookOpen {...props} />,
  "book-open": (props) => <BookOpen {...props} />,
}

const BY_SLUG: Record<string, IconRenderer> = {
  matematyka: (props) => <Sigma {...props} />,
  fizyka: (props) => <Atom {...props} />,
  informatyka: (props) => <Braces {...props} />,
  chemia: (props) => <FlaskConical {...props} />,
  biologia: (props) => <Leaf {...props} />,
  geografia: (props) => <Globe {...props} />,
  historia: (props) => <Landmark {...props} />,
  angielski: (props) => <Languages {...props} />,
  niemiecki: (props) => <Languages {...props} />,
  polski: (props) => <BookOpen {...props} />,
}

const FALLBACK: IconRenderer = (props) => <BookOpen {...props} />

export function SubjectIcon({
  subject,
  className,
}: {
  subject: { slug: string; icon?: string | null }
  className?: string
}) {
  const named = subject.icon ? BY_NAME[subject.icon.toLowerCase()] : undefined
  const render = named ?? BY_SLUG[subject.slug] ?? FALLBACK
  return render({ className })
}
