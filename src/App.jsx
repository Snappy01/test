import {useState, useEffect} from 'react'
import { Button } from '@heroui/react'
import SplitText from './components/SplitText'
import Cubes from './components/Cubes'
import Galaxy from './components/Galaxy'
import Header from './components/Header'

// Navbar commentée - gardée pour référence future
// import { Link, Navbar, NavbarBrand, NavbarContent, NavbarItem, NavbarMenuToggle, NavbarMenu, NavbarMenuItem, Switch } from '@heroui/react'

// Composants d'icônes pour le Switch Dark Mode - COMMENTÉS (Navbar désactivée)
/*
const MoonIcon = (props) => {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      height="1em"
      role="presentation"
      viewBox="0 0 24 24"
      width="1em"
      {...props}
    >
      <path
        d="M21.53 15.93c-.16-.27-.61-.69-1.73-.49a8.46 8.46 0 01-1.88.13 8.409 8.409 0 01-5.91-2.82 8.068 8.068 0 01-1.44-8.66c.44-1.01.13-1.54-.09-1.76s-.77-.55-1.83-.11a10.318 10.318 0 00-6.32 10.21 10.475 10.475 0 007.04 8.99 10 10 0 002.89.55c.16.01.32.02.48.02a10.5 10.5 0 008.47-4.27c.67-.93.49-1.519.32-1.79z"
        fill="currentColor"
      />
    </svg>
  );
};

const SunIcon = (props) => {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      height="1em"
      role="presentation"
      viewBox="0 0 24 24"
      width="1em"
      {...props}
    >
      <g fill="currentColor">
        <path d="M19 12a7 7 0 11-7-7 7 7 0 017 7z" />
        <path d="M12 22.96a.969.969 0 01-1-.96v-.08a1 1 0 012 0 1.038 1.038 0 01-1 1.04zm7.14-2.82a1.024 1.024 0 01-.71-.29l-.13-.13a1 1 0 011.41-1.41l.13.13a1 1 0 010 1.41.984.984 0 01-.7.29zm-14.28 0a1.024 1.024 0 01-.71-.29 1 1 0 010-1.41l.13-.13a1 1 0 011.41 1.41l-.13.13a1 1 0 01-.7.29zM22 13h-.08a1 1 0 010-2 1.038 1.038 0 011.04 1 .969.969 0 01-.96 1zM2.08 13H2a1 1 0 010-2 1.038 1.038 0 011.04 1 .969.969 0 01-.96 1zm16.93-7.01a1.024 1.024 0 01-.71-.29 1 1 0 010-1.41l.13-.13a1 1 0 011.41 1.41l-.13.13a.984.984 0 01-.7.29zm-14.02 0a1.024 1.024 0 01-.71-.29l-.13-.14a1 1 0 011.41-1.41l.13.13a1 1 0 010 1.41.97.97 0 01-.7.3zM12 3.04a.969.969 0 01-1-.96V2a1 1 0 012 0 1.038 1.038 0 01-1 1.04z" />
      </g>
    </svg>
  );
};
*/

function App() {
  const [selectedZone, setSelectedZone] = useState(null)
  const [isMobile, setIsMobile] = useState(false)
  const handleAnimationComplete = () => {
    console.log('All letters have animated!');
  };

  // Liens de navigation - COMMENTÉS (Navbar désactivée)
  /*
  const menuItems = [
    { name: 'Home', href: '#home' },
    { name: 'Buttons', href: '#buttons' },
    { name: 'Cubes', href: '#cubes' },
  ];
  */

  useEffect(() => {
    const checkMobile = () => {
      // Vérifie la largeur de l'écran (< 640px = mobile Tailwind)
      // OU détecte le User-Agent mobile
      setIsMobile(
        window.innerWidth < 640 || 
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
      )
    }
    
    checkMobile() // Vérifie au chargement
    window.addEventListener('resize', checkMobile) // Vérifie si redimensionnement
    
    return () => window.removeEventListener('resize', checkMobile)
  }, [])








  return (
    <div className="min-h-screen flex flex-col">
      {/* Navbar commentée - gardée pour référence future */}
      {/*
      <Navbar 
        onMenuOpenChange={setIsMenuOpen}
        isBordered
        isBlurred={false}
        className="bg-blue-900/90 backdrop-blur-sm"
        maxWidth="sm"
        disableAnimation={false}
      >
        <NavbarContent>
          <NavbarMenuToggle
            aria-label={isMenuOpen ? "Close menu" : "Open menu"}
            className="sm:hidden text-white"
          />
          <NavbarBrand>
            <p className="font-bold text-white text-xl">MyApp</p>
          </NavbarBrand>
        </NavbarContent>

        <NavbarContent className="hidden sm:flex gap-4 flex-1" justify="center">
          {menuItems.map((item, index) => (
            <NavbarItem key={`${item.name}-${index}`}>
              <Link
                color="foreground"
                href={item.href}
                className="text-white hover:text-blue-300 transition-colors"
              >
                {item.name}
              </Link>
            </NavbarItem>
          ))}
        </NavbarContent>

        <NavbarContent justify="end">
          <NavbarItem>
            <Switch
              defaultSelected
              color="success"
              endContent={<MoonIcon />}
              size="lg"
              startContent={<SunIcon />}
            >
              <span className="hidden sm:inline">Dark mode</span>
            </Switch>
          </NavbarItem>
        </NavbarContent>

        <NavbarMenu className="bg-blue-900 max-h-[50vh]">
          {menuItems.map((item, index) => (
            <NavbarMenuItem key={`${item.name}-${index}`}>
              <Link
                color="foreground"
                href={item.href}
                className="w-full text-white hover:text-blue-300"
                size="lg"
              >
                {item.name}
              </Link>
            </NavbarMenuItem>
          ))}
        </NavbarMenu>
      </Navbar>
      */}

      {/* Nouveau Header avec Drawer */}
      <Header selectedZone={selectedZone} onZoneSelect={setSelectedZone} />
     
    <div id="home" className="bg-blue-900 text-white flex flex-col items-center justify-start gap-4 p-8">
      <h1 id="buttons" className="text-4xl font-bold mb-8">HeroUI Buttons Examples</h1>
      
      <div className="flex flex-wrap gap-4 items-center justify-center">
        <Button color="primary">Primary</Button>
        <Button color="secondary">Secondary</Button>
        <Button color="success">Success</Button>
        <Button color="warning">Warning</Button>
        <Button color="danger">Danger</Button>
      </div>

      <div className="flex flex-wrap gap-4 items-center justify-center">
        <Button variant="solid" color="primary">Solid</Button>
        <Button variant="bordered" color="primary">Bordered</Button>
        <Button variant="light" color="primary">Light</Button>
        <Button variant="flat" color="primary">Flat</Button>
        <Button variant="faded" color="primary">Faded</Button>
        <Button variant="shadow" color="primary">Shadow</Button>
        <Button variant="ghost" color="primary">Ghost</Button>
      </div>

      <div className="flex flex-wrap gap-4 items-center justify-center">
        <Button size="sm" color="primary">Small</Button>
        <Button size="md" color="primary">Medium</Button>
        <Button size="lg" color="primary">Large</Button>
      </div>

      <div className="flex flex-wrap gap-4 items-center justify-center">
        <Button isLoading color="primary">Loading</Button>
        <Button isDisabled color="primary">Disabled</Button>
      </div>

      <SplitText
        text="Hello, GSAP!"
        className="text-2xl font-semibold text-center"
        delay={100}
        duration={0.6}
        ease="power3.out"
        splitType="chars"
        from={{ opacity: 0, y: 40 }}
        to={{ opacity: 1, y: 0 }}
        threshold={0.1}       
        textAlign="center"
        onLetterAnimationComplete={handleAnimationComplete}
      />
</div>
{!isMobile && <div id="cubes" className="bg-blue-900 flex flex-col items-center justify-center p-8 pb-16 flex-auto">
  <Cubes 
    gridSize={8}
    maxAngle={60}
    radius={4}
    borderStyle="1px dashed #5227FF"
    faceColor="#1a1a2e"
    rippleColor="#ff6b6b"
    rippleSpeed={1.5}
    autoAnimate={true}
    rippleOnClick={true}
  />
  
</div>}
</div>

  )
}

export default App
