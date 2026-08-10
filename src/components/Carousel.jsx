import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, useMotionValue, useTransform } from 'motion/react';
import {
  FiFileText,
  FiLayers,
  FiHeart,
  FiShoppingBag,
  FiUserPlus
} from 'react-icons/fi';

import './Carousel.css';

const DEFAULT_ITEMS = [
  {
    title: 'Anonymous Confessions',
    description: 'Share real, unfiltered campus thoughts with complete identity privacy.',
    id: 1,
    icon: <FiFileText className="carousel-icon" />,
    badge: 'LIVE',
    badgeColor: '#f43f5e',
    stat: '12K+ confessions today',
    tags: ['Vanish Mode', 'Anonymous Replies', 'Safe Reports', 'Confession Feed'],
    accent: 'from-rose-500/10 via-transparent to-transparent'
  },
  {
    title: 'Campus Community',
    description: 'Discover college clubs, academic groups, and live chat rooms.',
    id: 2,
    icon: <FiLayers className="carousel-icon" />,
    badge: 'POPULAR',
    badgeColor: '#6366f1',
    stat: '800+ active groups',
    tags: ['Study Circles', 'Branch Groups', 'Live Chat', 'Event Hub'],
    accent: 'from-indigo-500/10 via-transparent to-transparent'
  },
  {
    title: 'Campus Marketplace',
    description: 'Buy and sell textbooks, gadgets, and more with fellow students.',
    id: 3,
    icon: <FiShoppingBag className="carousel-icon" />,
    badge: 'NEW',
    badgeColor: '#14b8a6',
    stat: '3K+ listings',
    tags: ['Textbooks', 'Electronics', 'Notes & PDFs', 'Campus Delivery'],
    accent: 'from-teal-500/10 via-transparent to-transparent'
  },
  {
    title: 'Make a Friend',
    description: 'Connect with like-minded peers based on vibe, interests, and branch.',
    id: 4,
    icon: <FiUserPlus className="carousel-icon" />,
    badge: 'HOT',
    badgeColor: '#f59e0b',
    stat: '5K+ matches this week',
    tags: ['Vibe Match', 'Interest Tags', 'Peer Connect', 'Icebreaker'],
    accent: 'from-amber-500/10 via-transparent to-transparent'
  },
  {
    title: 'Verified Peer Circles',
    description: 'Trusted networks verified by college email for safe interactions.',
    id: 5,
    icon: <FiHeart className="carousel-icon" />,
    badge: 'SECURE',
    badgeColor: '#a855f7',
    stat: '100% college-verified',
    tags: ['Email Verified', 'Trust Badge', 'Safe Chat', 'Anti-Spam'],
    accent: 'from-purple-500/10 via-transparent to-transparent'
  }
];

const DRAG_BUFFER = 0;
const VELOCITY_THRESHOLD = 500;
const GAP = 0;
const SPRING_OPTIONS = { type: 'spring', stiffness: 300, damping: 30 };

function CarouselItem({ item, index, itemWidth, round, trackItemOffset, x, transition }) {
  const range = [-(index + 1) * trackItemOffset, -index * trackItemOffset, -(index - 1) * trackItemOffset];
  const outputRange = [90, 0, -90];
  const rotateY = useTransform(x, range, outputRange, { clamp: false });

  return (
    <motion.div
      key={`${item?.id ?? index}-${index}`}
      className={`carousel-item ${round ? 'round' : ''}`}
      style={{
        width: itemWidth,
        height: round ? itemWidth : '100%',
        rotateY: rotateY,
        ...(round && { borderRadius: '50%' })
      }}
      transition={transition}
    >
      {/* Accent gradient background */}
      <div className={`carousel-item-accent bg-gradient-to-br ${item.accent}`} />

      {/* Top row: icon + badge */}
      <div className="carousel-item-top">
        <span className="carousel-icon-container">{item.icon}</span>
        <span
          className="carousel-badge"
          style={{ background: `${item.badgeColor}22`, color: item.badgeColor, border: `1px solid ${item.badgeColor}55` }}
        >
          {item.badge}
        </span>
      </div>

      {/* Middle: feature toggles */}
      <div className="carousel-item-middle">
        <p className="carousel-stat">{item.stat}</p>
        <div className="carousel-tags">
          {item.tags.map((tag, i) => (
            <span key={i} className="carousel-tag">
              <span className="carousel-tag-dot" />
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Bottom: title + description */}
      <div className="carousel-item-content">
        <div className="carousel-item-title">{item.title}</div>
        <p className="carousel-item-description">{item.description}</p>
      </div>
    </motion.div>
  );
}

export default function Carousel({
  items = DEFAULT_ITEMS,
  baseWidth = 300,
  autoplay = false,
  autoplayDelay = 3000,
  pauseOnHover = false,
  loop = false,
  round = false
}) {
  const containerPadding = 0;
  const itemWidth = baseWidth - containerPadding * 2;
  const trackItemOffset = itemWidth + GAP;

  const itemsForRender = useMemo(() => {
    if (!loop) return items;
    if (items.length === 0) return [];
    return [items[items.length - 1], ...items, items[0]];
  }, [items, loop]);

  const [position, setPosition] = useState(loop ? 1 : 0);
  const x = useMotionValue(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isJumping, setIsJumping] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  const containerRef = useRef(null);

  useEffect(() => {
    if (pauseOnHover && containerRef.current) {
      const container = containerRef.current;
      const handleMouseEnter = () => setIsHovered(true);
      const handleMouseLeave = () => setIsHovered(false);
      container.addEventListener('mouseenter', handleMouseEnter);
      container.addEventListener('mouseleave', handleMouseLeave);
      return () => {
        container.removeEventListener('mouseenter', handleMouseEnter);
        container.removeEventListener('mouseleave', handleMouseLeave);
      };
    }
  }, [pauseOnHover]);

  useEffect(() => {
    if (!autoplay || itemsForRender.length <= 1) return undefined;
    if (pauseOnHover && isHovered) return undefined;

    const timer = setInterval(() => {
      setPosition(prev => Math.min(prev + 1, itemsForRender.length - 1));
    }, autoplayDelay);

    return () => clearInterval(timer);
  }, [autoplay, autoplayDelay, isHovered, pauseOnHover, itemsForRender.length]);

  useEffect(() => {
    const startingPosition = loop ? 1 : 0;
    setPosition(startingPosition);
    x.set(-startingPosition * trackItemOffset);
  }, [items.length, loop, trackItemOffset, x]);

  useEffect(() => {
    if (!loop && position > itemsForRender.length - 1) {
      setPosition(Math.max(0, itemsForRender.length - 1));
    }
  }, [itemsForRender.length, loop, position]);

  const effectiveTransition = isJumping ? { duration: 0 } : SPRING_OPTIONS;

  const handleAnimationStart = () => setIsAnimating(true);

  const handleAnimationComplete = () => {
    if (!loop || itemsForRender.length <= 1) {
      setIsAnimating(false);
      return;
    }
    const lastCloneIndex = itemsForRender.length - 1;

    if (position === lastCloneIndex) {
      setIsJumping(true);
      const target = 1;
      setPosition(target);
      x.set(-target * trackItemOffset);
      requestAnimationFrame(() => {
        setIsJumping(false);
        setIsAnimating(false);
      });
      return;
    }

    if (position === 0) {
      setIsJumping(true);
      const target = items.length;
      setPosition(target);
      x.set(-target * trackItemOffset);
      requestAnimationFrame(() => {
        setIsJumping(false);
        setIsAnimating(false);
      });
      return;
    }

    setIsAnimating(false);
  };

  const handleDragEnd = (_, info) => {
    const { offset, velocity } = info;
    const direction =
      offset.x < -DRAG_BUFFER || velocity.x < -VELOCITY_THRESHOLD
        ? 1
        : offset.x > DRAG_BUFFER || velocity.x > VELOCITY_THRESHOLD
          ? -1
          : 0;

    if (direction === 0) return;

    setPosition(prev => {
      const next = prev + direction;
      const max = itemsForRender.length - 1;
      return Math.max(0, Math.min(next, max));
    });
  };

  const dragProps = loop
    ? {}
    : {
        dragConstraints: {
          left: -trackItemOffset * Math.max(itemsForRender.length - 1, 0),
          right: 0
        }
      };

  const activeIndex =
    items.length === 0 ? 0 : loop ? (position - 1 + items.length) % items.length : Math.min(position, items.length - 1);

  return (
    <div
      ref={containerRef}
      className={`carousel-container ${round ? 'round' : ''}`}
      style={{
        width: `${baseWidth}px`,
        ...(round && { height: `${baseWidth}px`, borderRadius: '50%' })
      }}
    >
      <motion.div
        className="carousel-track"
        drag={isAnimating ? false : 'x'}
        {...dragProps}
        style={{
          width: itemWidth,
          gap: `${GAP}px`,
          perspective: 1000,
          perspectiveOrigin: `${position * trackItemOffset + itemWidth / 2}px 50%`,
          x
        }}
        onDragEnd={handleDragEnd}
        animate={{ x: -(position * trackItemOffset) }}
        transition={effectiveTransition}
        onAnimationStart={handleAnimationStart}
        onAnimationComplete={handleAnimationComplete}
      >
        {itemsForRender.map((item, index) => (
          <CarouselItem
            key={`${item?.id ?? index}-${index}`}
            item={item}
            index={index}
            itemWidth={itemWidth}
            round={round}
            trackItemOffset={trackItemOffset}
            x={x}
            transition={effectiveTransition}
          />
        ))}
      </motion.div>
      <div className={`carousel-indicators-container ${round ? 'round' : ''}`}>
        <div className="carousel-indicators">
          {items.map((_, index) => (
            <motion.button
              type="button"
              key={index}
              className={`carousel-indicator ${activeIndex === index ? 'active' : 'inactive'}`}
              aria-label={`Go to slide ${index + 1}`}
              aria-current={activeIndex === index}
              animate={{ scale: activeIndex === index ? 1.2 : 1 }}
              onClick={() => setPosition(loop ? index + 1 : index)}
              transition={{ duration: 0.15 }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
