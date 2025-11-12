'use client';

import { useEffect, useMemo, useState } from 'react';
import styles from './page.module.css';

type Upgrade = {
  id: string;
  name: string;
  description: string;
  baseCost: number;
  costGrowth: number;
  basePower: number;
  type: 'click' | 'automation';
  icon: string;
};

type UpgradeState = Record<string, { level: number; cost: number }>;

type MilestoneState = Record<string, boolean>;

type SaveState = {
  totalClicks: number;
  resources: number;
  clickStrength: number;
  automationRate: number;
  upgrades: UpgradeState;
  version: number;
  milestones: MilestoneState;
};

const STORAGE_KEY = 'clicker-simf-save-v1';

const UPGRADES: Upgrade[] = [
  {
    id: 'finger-training',
    name: 'Finger Training',
    description: 'Precision drills boost manual clicking power.',
    baseCost: 15,
    costGrowth: 1.15,
    basePower: 1,
    type: 'click',
    icon: '🖐️'
  },
  {
    id: 'titanium-pointer',
    name: 'Titanium Pointer',
    description: 'A high-tech stylus engineered for clicks.',
    baseCost: 120,
    costGrowth: 1.22,
    basePower: 8,
    type: 'click',
    icon: '🖱️'
  },
  {
    id: 'quantum-glove',
    name: 'Quantum Glove',
    description: 'Phase-shifted taps register multiple hits.',
    baseCost: 850,
    costGrowth: 1.3,
    basePower: 32,
    type: 'click',
    icon: '🧤'
  },
  {
    id: 'nanobot-squad',
    name: 'Nanobot Squad',
    description: 'Swarm of nanobots assisting each click.',
    baseCost: 4200,
    costGrowth: 1.38,
    basePower: 120,
    type: 'click',
    icon: '🤖'
  },
  {
    id: 'macro-rig',
    name: 'Macro Rig',
    description: 'Automated macros perform relentless clicking.',
    baseCost: 75,
    costGrowth: 1.2,
    basePower: 0.5,
    type: 'automation',
    icon: '⚙️'
  },
  {
    id: 'drone-fleet',
    name: 'Drone Fleet',
    description: 'Personal drone squad executing per-second taps.',
    baseCost: 650,
    costGrowth: 1.25,
    basePower: 8,
    type: 'automation',
    icon: '🛸'
  },
  {
    id: 'fusion-reactor',
    name: 'Fusion Reactor',
    description: 'Bends time, delivering streams of simulated clicks.',
    baseCost: 5800,
    costGrowth: 1.3,
    basePower: 44,
    type: 'automation',
    icon: '⚛️'
  },
  {
    id: 'chroniton-loop',
    name: 'Chroniton Loop',
    description: 'Cycles future energy into present automation.',
    baseCost: 24000,
    costGrowth: 1.35,
    basePower: 165,
    type: 'automation',
    icon: '🌀'
  }
];

const formatNumber = (value: number) => {
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(2)}b`;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}m`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(2)}k`;
  if (value === 0) return '0';
  return value.toFixed(0);
};

export default function Page() {
  const [resources, setResources] = useState(0);
  const [totalClicks, setTotalClicks] = useState(0);
  const [clickStrength, setClickStrength] = useState(1);
  const [automationRate, setAutomationRate] = useState(0);
  const [upgrades, setUpgrades] = useState<UpgradeState>({});
  const [milestones, setMilestones] = useState<MilestoneState>({});
  const [tickRate, setTickRate] = useState(1000);

  const computedUpgrades = useMemo(
    () =>
      UPGRADES.map((upgrade) => {
        const entry = upgrades[upgrade.id] ?? { level: 0, cost: upgrade.baseCost };
        return {
          ...upgrade,
          level: entry.level,
          nextCost: entry.cost
        };
      }),
    [upgrades]
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return;

    try {
      const saved = JSON.parse(raw) as SaveState;
      if (saved.version !== 1) return;
      setResources(saved.resources);
      setTotalClicks(saved.totalClicks);
      setClickStrength(saved.clickStrength);
      setAutomationRate(saved.automationRate);
      setUpgrades(saved.upgrades);
      setMilestones(saved.milestones ?? {});
    } catch (error) {
      console.error('Failed to load save', error);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const payload: SaveState = {
      resources,
      totalClicks,
      clickStrength,
      automationRate,
      upgrades,
      milestones,
      version: 1
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }, [resources, totalClicks, clickStrength, automationRate, upgrades, milestones]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      if (automationRate === 0) return;
      setResources((value) => value + automationRate / (1000 / tickRate));
      setTotalClicks((value) => value + automationRate / (1000 / tickRate));
    }, tickRate);

    return () => window.clearInterval(interval);
  }, [automationRate, tickRate]);

  const performClick = () => {
    setResources((value) => value + clickStrength);
    setTotalClicks((value) => value + clickStrength);
  };

  const buyUpgrade = (upgrade: Upgrade & { level: number; nextCost: number }) => {
    if (resources < upgrade.nextCost) return;

    setResources((value) => value - upgrade.nextCost);
    setUpgrades((state) => {
      const entry = state[upgrade.id] ?? { level: 0, cost: upgrade.baseCost };
      const level = entry.level + 1;
      const nextCost = Math.ceil(entry.cost * upgrade.costGrowth);
      return {
        ...state,
        [upgrade.id]: { level, cost: nextCost }
      };
    });

    if (upgrade.type === 'click') {
      setClickStrength((value) => value + upgrade.basePower);
    } else {
      setAutomationRate((value) => value + upgrade.basePower);
      if ((upgrade.level + 1) % 5 === 0) {
        setTickRate((value) => Math.max(250, value - 30));
      }
    }
  };

  useEffect(() => {
    const milestoneList: { id: string; threshold: number; handler: () => void }[] = [
      {
        id: 'first-click',
        threshold: 1,
        handler: () => setClickStrength((value) => value + 1)
      },
      {
        id: 'hundred-clicks',
        threshold: 100,
        handler: () => setTickRate((value) => Math.max(250, value - 150))
      },
      {
        id: 'thousand-clicks',
        threshold: 1_000,
        handler: () => setAutomationRate((value) => value + 30)
      },
      {
        id: 'millionaire',
        threshold: 1_000_000,
        handler: () => setClickStrength((value) => value * 1.2)
      }
    ];

    milestoneList.forEach((milestone) => {
      if (milestones[milestone.id]) return;
      if (totalClicks >= milestone.threshold) {
        milestone.handler();
        setMilestones((state) => ({ ...state, [milestone.id]: true }));
      }
    });
  }, [totalClicks, milestones]);

  const resetGame = () => {
    setResources(0);
    setTotalClicks(0);
    setClickStrength(1);
    setAutomationRate(0);
    setUpgrades({});
    setMilestones({});
    setTickRate(1000);
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  };

  const totals = {
    perSecond: automationRate + clickStrength,
    manual: clickStrength,
    automation: automationRate
  };

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <header className={styles.hero}>
          <div className={styles.heroMeta}>Clicker Simf</div>
          <h1 className={styles.heroTitle}>Hyperactive Clicker Simulation</h1>
          <p className={styles.heroCopy}>
            Harness futuristic assists, automate the grind, and chase quantum milestones. Every tap matters.
          </p>
        </header>

        <section className={styles.coreGrid}>
          <div className={styles.controlPanel}>
            <div className={styles.primaryCard}>
              <div className={styles.balanceBlock}>
                <span className={styles.balanceLabel}>Simf Credits</span>
                <span className={styles.balanceValue}>{formatNumber(resources)}</span>
              </div>
              <button className={styles.clickButton} onClick={performClick}>
                Tap!
              </button>
              <div className={styles.statGrid}>
                <div className={styles.statCard}>
                  <span className={styles.statLabel}>Manual Strength</span>
                  <span className={styles.statValue}>{formatNumber(totals.manual)}</span>
                </div>
                <div className={styles.statCard}>
                  <span className={styles.statLabel}>Automation Rate</span>
                  <span className={styles.statValue}>{formatNumber(totals.automation)}</span>
                </div>
                <div className={styles.statCard}>
                  <span className={styles.statLabel}>Total Taps</span>
                  <span className={styles.statValue}>{formatNumber(totalClicks)}</span>
                </div>
                <div className={styles.statCard}>
                  <span className={styles.statLabel}>Simf per Second</span>
                  <span className={styles.statValue}>{formatNumber(totals.perSecond)}</span>
                </div>
              </div>
            </div>

            <div className={styles.milestoneCard}>
              <div className={styles.milestoneHeader}>
                <h2>Milestones</h2>
                <button className={styles.resetButton} onClick={resetGame}>
                  Reset Progress
                </button>
              </div>
              <ul className={styles.milestoneList}>
                {['first-click', 'hundred-clicks', 'thousand-clicks', 'millionaire'].map((id) => {
                  const config: Record<string, { title: string; reward: string; threshold: number; description: string }> = {
                    'first-click': {
                      title: 'First Tap',
                      reward: '+1 manual strength',
                      threshold: 1,
                      description: 'Make your first simulated tap.'
                    },
                    'hundred-clicks': {
                      title: 'Fast Fingers',
                      reward: 'Faster automation interval',
                      threshold: 100,
                      description: 'Accumulate 100 total taps.'
                    },
                    'thousand-clicks': {
                      title: 'Click Maestro',
                      reward: '+30 automation rate',
                      threshold: 1_000,
                      description: 'Reach 1,000 total taps.'
                    },
                    millionaire: {
                      title: 'Pocket Millionaire',
                      reward: '+20% manual strength',
                      threshold: 1_000_000,
                      description: 'Bank one million Simf Credits.'
                    }
                  };

                  const milestone = config[id];
                  const achieved = Boolean(milestones[id]);
                  const width = Math.min(100, (totalClicks / milestone.threshold) * 100);

                  return (
                    <li
                      key={id}
                      className={`${styles.milestoneItem} ${achieved ? styles.milestoneAchieved : ''}`}
                    >
                      <div className={styles.milestoneContent}>
                        <div>
                          <h3>{milestone.title}</h3>
                          <p>{milestone.description}</p>
                        </div>
                        <span className={styles.milestoneReward}>Reward: {milestone.reward}</span>
                        <div className={styles.progressBar}>
                          <div className={styles.progressFill} style={{ width: `${width}%` }} />
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>

          <div className={styles.upgradeColumn}>
            <div className={styles.upgradeCard}>
              <div className={styles.upgradeHeader}>
                <h2>Upgrade Array</h2>
                <span>Available Boosts</span>
              </div>
              <div className={styles.upgradeList}>
                {computedUpgrades.map((upgrade) => {
                  const affordable = resources >= upgrade.nextCost;
                  const progress = Math.min(100, (resources / upgrade.nextCost) * 100);
                  return (
                    <button
                      key={upgrade.id}
                      className={`${styles.upgradeItem} ${affordable ? styles.upgradeReady : ''}`}
                      onClick={() => buyUpgrade(upgrade)}
                      disabled={!affordable}
                    >
                      <span className={styles.upgradeIcon}>{upgrade.icon}</span>
                      <div className={styles.upgradeDetails}>
                        <div className={styles.upgradeTitleRow}>
                          <span className={styles.upgradeTitle}>{upgrade.name}</span>
                          <span className={styles.upgradeLevel}>Level {upgrade.level}</span>
                        </div>
                        <p>{upgrade.description}</p>
                        <div className={styles.upgradeMeta}>
                          <span>Cost: {formatNumber(upgrade.nextCost)}</span>
                          <span>
                            {upgrade.type === 'click'
                              ? `+${formatNumber(upgrade.basePower)} per tap`
                              : `+${formatNumber(upgrade.basePower)} / sec`}
                          </span>
                        </div>
                        <div className={styles.progressBar}>
                          <div className={styles.progressFill} style={{ width: `${progress}%` }} />
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className={styles.labCard}>
              <h2>Quantum Lab</h2>
              <p>
                Research modifiers introduce unique twists. Every fifth automation upgrade reduces the global tick rate,
                accelerating passive income.
              </p>
              <div className={styles.labGrid}>
                {computedUpgrades
                  .filter((upgrade) => upgrade.type === 'automation')
                  .map((upgrade) => {
                    const tierBonus = Math.floor(upgrade.level / 5);
                    return (
                      <div key={upgrade.id} className={styles.labItem}>
                        <div className={styles.labTier}>Tier {tierBonus}</div>
                        <h3>{upgrade.name}</h3>
                        <p>
                          Each tier unlocks {formatNumber(upgrade.basePower * 3)} extra passive taps and trims tick
                          interval by 30ms.
                        </p>
                        <div className={styles.labStats}>
                          <span>Automation LVL: {upgrade.level}</span>
                          <span>Boost: +{formatNumber(tierBonus * upgrade.basePower * 3)}</span>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
