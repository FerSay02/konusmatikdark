import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import './PillNav.css';

export default function PillNav({
  logo,
  logoAlt = 'Logo',
  items = [],
  activeHref,
  onNavigate,
  className = '',
  ease = 'power2.out',
  baseColor,
  pillColor = '#ffffff',
  hoveredPillTextColor = '#ffffff',
  pillTextColor = '#111827',
  initialLoadAnimation = true,
  rightContent = null,
}) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navItemsRef = useRef(null);
  const logoRef = useRef(null);
  const circleRefs = useRef([]);
  const timelinesRef = useRef([]);
  const mobileMenuButtonRef = useRef(null);

  useEffect(() => {
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') {
        setIsMobileMenuOpen(false);
        mobileMenuButtonRef.current?.focus();
      }
    };
    const closeOnResize = () => {
      if (window.matchMedia('(min-width: 1100px)').matches) setIsMobileMenuOpen(false);
    };
    window.addEventListener('keydown', closeOnEscape);
    window.addEventListener('resize', closeOnResize);
    return () => {
      window.removeEventListener('keydown', closeOnEscape);
      window.removeEventListener('resize', closeOnResize);
    };
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [activeHref]);

  useEffect(() => {
    document.body.classList.toggle('mobile-nav-open', isMobileMenuOpen);
    return () => document.body.classList.remove('mobile-nav-open');
  }, [isMobileMenuOpen]);

  useEffect(() => {
    const layout = () => {
      circleRefs.current.forEach((circle, index) => {
        if (!circle?.parentElement) return;
        const pill = circle.parentElement;
        const { width, height } = pill.getBoundingClientRect();
        const radius = ((width * width) / 4 + height * height) / (2 * height);
        const diameter = Math.ceil(radius * 2) + 2;
        const delta = Math.ceil(radius - Math.sqrt(Math.max(0, radius * radius - (width * width) / 4))) + 1;
        circle.style.width = `${diameter}px`;
        circle.style.height = `${diameter}px`;
        circle.style.bottom = `-${delta}px`;
        gsap.set(circle, { xPercent: -50, scale: 0, transformOrigin: `50% ${diameter - delta}px` });

        const label = pill.querySelector('.pill-label');
        const hoverLabel = pill.querySelector('.pill-label-hover');
        gsap.set(label, { y: 0 });
        gsap.set(hoverLabel, { y: height + 12, opacity: 0 });
        timelinesRef.current[index]?.kill();
        timelinesRef.current[index] = gsap.timeline({ paused: true })
          .to(circle, { scale: 1.2, duration: 0.55, ease }, 0)
          .to(label, { y: -(height + 8), duration: 0.55, ease }, 0)
          .to(hoverLabel, { y: 0, opacity: 1, duration: 0.55, ease }, 0);
      });
    };

    layout();
    window.addEventListener('resize', layout);
    if (document.fonts?.ready) document.fonts.ready.then(layout).catch(() => {});

    if (initialLoadAnimation) {
      gsap.fromTo(logoRef.current, { scale: 0.72, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.55, ease });
      gsap.fromTo(navItemsRef.current, { width: 0, opacity: 0 }, { width: 'auto', opacity: 1, duration: 0.6, ease });
    }

    return () => window.removeEventListener('resize', layout);
  }, [ease, initialLoadAnimation, items]);

  const handleNavigate = (page) => {
    setIsMobileMenuOpen(false);
    onNavigate?.(page);
  };

  const cssVars = {
    '--pill-base': baseColor,
    '--pill-bg': pillColor,
    '--pill-hover-text': hoveredPillTextColor,
    '--pill-text': pillTextColor,
  };

  return (
    <div className={`pill-nav-container ${className}`}>
      <nav className="pill-nav" style={cssVars} aria-label="Primary">
        <a className="pill-logo" href="/" aria-label={logoAlt} ref={logoRef} onClick={(event) => { event.preventDefault(); handleNavigate('home'); }}>
          <img src={logo} alt={logoAlt} />
        </a>

        <div className="pill-nav-items" ref={navItemsRef}>
          <ul className="pill-list" role="menubar">
            {items.map((item, index) => (
              <li key={item.href} role="none">
                <a
                  href={item.href}
                  role="menuitem"
                  className={`pill${activeHref === item.href ? ' is-active' : ''}`}
                  onClick={(event) => { event.preventDefault(); handleNavigate(item.page); }}
                  onMouseEnter={() => timelinesRef.current[index]?.play()}
                  onMouseLeave={() => timelinesRef.current[index]?.reverse()}
                >
                  <span className="hover-circle" aria-hidden="true" ref={(element) => { circleRefs.current[index] = element; }} />
                  <span className="label-stack"><span className="pill-label">{item.label}</span><span className="pill-label-hover" aria-hidden="true">{item.label}</span></span>
                </a>
              </li>
            ))}
          </ul>
        </div>

        {rightContent && <div className="pill-nav-right-content">{rightContent}</div>}

        <button ref={mobileMenuButtonRef} type="button" className="pill-mobile-menu" onClick={() => setIsMobileMenuOpen((open) => !open)} aria-label={isMobileMenuOpen ? 'Menüyü kapat' : 'Menüyü aç'} aria-controls="pill-mobile-popover" aria-expanded={isMobileMenuOpen}>
          <span /><span /><span />
        </button>
      </nav>

      <div className={`pill-mobile-backdrop ${isMobileMenuOpen ? 'is-open' : ''}`} aria-hidden="true" onClick={() => setIsMobileMenuOpen(false)} />
      <div id="pill-mobile-popover" className={`pill-mobile-popover ${isMobileMenuOpen ? 'is-open' : ''}`} style={cssVars} aria-hidden={!isMobileMenuOpen} inert={!isMobileMenuOpen}>
        <div className="pill-mobile-popover-head"><span>Menu</span><button type="button" onClick={() => { setIsMobileMenuOpen(false); mobileMenuButtonRef.current?.focus(); }} aria-label="Close menu">×</button></div>
        <div className="pill-mobile-popover-links">
          {items.map((item) => (
            <button type="button" key={item.href} className={item.href === activeHref ? 'is-active' : ''} onClick={() => handleNavigate(item.page)}>{item.label}</button>
          ))}
        </div>
        {rightContent && <div className="pill-mobile-popover-account">{rightContent}</div>}
      </div>
    </div>
  );
}
