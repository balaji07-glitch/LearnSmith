import React, { useState, useEffect } from 'react';
import { api } from './api.ts';
import { Unit } from './types/index.ts';
import { LoginPage, AuthUser } from './pages/LoginPage.tsx';
import { Sidebar } from './components/Sidebar.tsx';
import { Header } from './components/Header.tsx';
import { Dashboard } from './pages/Dashboard.tsx';
import { UnitsList } from './pages/UnitsList.tsx';
import { CreateUnit } from './pages/CreateUnit.tsx';
import { UnitOverview } from './pages/UnitOverview.tsx';
import { SourceWorkspace } from './pages/SourceWorkspace.tsx';
import { ObjectivesView } from './pages/ObjectivesView.tsx';
import { GenerateScreen } from './pages/GenerateScreen.tsx';
import { PackOverview } from './pages/PackOverview.tsx';
import { AssetReview } from './pages/AssetReview.tsx';
import { QualityDashboard } from './pages/QualityDashboard.tsx';
import { AlignmentMap } from './pages/AlignmentMap.tsx';
import { VersionHistory } from './pages/VersionHistory.tsx';
import { ReviewQueue } from './pages/ReviewQueue.tsx';
import { StudentMode } from './pages/StudentMode.tsx';
import { StudentHome } from './pages/StudentHome.tsx';
import { StudentModeGate } from './pages/StudentModeGate.tsx';
import { ExportCenter } from './pages/ExportCenter.tsx';
import { Moon, Sun } from 'lucide-react';

type Theme = 'light' | 'dark';

const ThemeToggle: React.FC<{ theme: Theme; onToggle: () => void }> = ({ theme, onToggle }) => (
  <button
    type="button"
    onClick={onToggle}
    aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
    aria-pressed={theme === 'dark'}
    title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
    className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-semibold text-slate-700 shadow-lg transition-colors hover:bg-slate-50"
  >
    {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    <span>{theme === 'dark' ? 'Light mode' : 'Dark mode'}</span>
  </button>
);

export default function App() {
  const [theme, setTheme] = useState<Theme>(() =>
    localStorage.getItem('ls_theme') === 'dark' ? 'dark' : 'light'
  );
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('ls_theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.removeItem('ls_auth_user');
  }, []);

  const [currentView, setCurrentView] = useState<string>('dashboard');
  const [activeUnit, setActiveUnit] = useState<Unit | null>(null);
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
  // Student: pick which unit to view (when logged in as student role)
  const [studentUnitId, setStudentUnitId] = useState<string | null>(null);
  // Teacher previewing student mode — gate + student identity
  const [showStudentGate, setShowStudentGate] = useState(false);
  const [gateStudent, setGateStudent] = useState<AuthUser | null>(null);

  // Unit metrics for header
  const [approvedCount, setApprovedCount] = useState<number>(0);
  const [qualityIssuesCount, setQualityIssuesCount] = useState<number>(0);

  const fetchActiveUnitMetrics = async (unitId: string) => {
    try {
      const summary = await api.getUnitSummary(unitId);
      setActiveUnit(summary.unit);
      setApprovedCount(summary.approvedAssetCount);
      setQualityIssuesCount(summary.qualityIssueCount);
    } catch (err) {
      console.error('Failed to load active unit metrics:', err);
    }
  };

  // Restore SPA state from a browser history entry
  const restoreFromHistoryState = (state: any) => {
    if (!state) return;
    const { view, unitId, assetId } = state;
    if (assetId) setSelectedAssetId(assetId);
    setCurrentView(view || 'dashboard');
    if (unitId) {
      api.getUnit(unitId).then((res) => {
        setActiveUnit(res.unit);
        fetchActiveUnitMetrics(unitId);
      }).catch(() => {});
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Seed the initial history entry and listen for back/forward
  useEffect(() => {
    window.history.replaceState(
      { view: 'dashboard', unitId: null, assetId: null },
      '',
      window.location.href
    );
    const onPopState = (e: PopStateEvent) => restoreFromHistoryState(e.state);
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const handleNavigate = (view: string, unitId?: string, assetId?: string) => {
    // Intercept Student Mode: require student login first
    if (view === 'unit_student') {
      if (unitId && (!activeUnit || activeUnit.id !== unitId)) {
        api.getUnit(unitId).then((res) => {
          setActiveUnit(res.unit);
          fetchActiveUnitMetrics(unitId);
        });
      }
      setShowStudentGate(true);
      return;
    }

    if (unitId && (!activeUnit || activeUnit.id !== unitId)) {
      api.getUnit(unitId).then((res) => {
        setActiveUnit(res.unit);
        fetchActiveUnitMetrics(unitId);
      });
    } else if (unitId) {
      fetchActiveUnitMetrics(unitId);
    }

    if (assetId) {
      setSelectedAssetId(assetId);
    }

    setCurrentView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Push a history entry so browser back/forward stays within the app
    window.history.pushState(
      { view, unitId: unitId ?? activeUnit?.id ?? null, assetId: assetId ?? null },
      '',
      window.location.href
    );
  };

  const handleLoadDemo = async () => {
    try {
      await api.loadDemoUnit();
      const unitsRes = await api.getUnits();
      const demo = unitsRes.units.find((u) => u.id === 'unit_demo_networking') || unitsRes.units[0];
      if (demo) {
        setActiveUnit(demo);
        fetchActiveUnitMetrics(demo.id);
        setCurrentView('unit_overview');
        window.history.pushState(
          { view: 'unit_overview', unitId: demo.id, assetId: null },
          '',
          window.location.href
        );
      }
    } catch (err: any) {
      alert(err?.message || 'Failed to initialize demo unit');
    }
  };

  const handleLogin = (user: AuthUser) => {
    setAuthUser(user);
    // Let students choose any available unit after signing in.
    setStudentUnitId(null);
  };

  const handleLogout = () => {
    localStorage.removeItem('ls_auth_user');
    setAuthUser(null);
    setStudentUnitId(null);
    setCurrentView('dashboard');
    setActiveUnit(null);
    window.history.replaceState({ view: 'dashboard', unitId: null, assetId: null }, '', window.location.href);
  };

  const handleExitStudentPreview = () => {
    setCurrentView('unit_overview');
    setGateStudent(null);
    if (activeUnit) {
      window.history.pushState(
        { view: 'unit_overview', unitId: activeUnit.id, assetId: null },
        '',
        window.location.href
      );
    }
  };

  // Show login gate
  if (!authUser) {
    return (
      <>
        <LoginPage onLogin={handleLogin} />
        <ThemeToggle theme={theme} onToggle={() => setTheme((current) => current === 'dark' ? 'light' : 'dark')} />
      </>
    );
  }

  // Students: show grade-filtered home or specific unit
  if (authUser.role === 'student') {
    // If a unit is selected, show StudentMode for it
    if (studentUnitId) {
      return (
        <>
          <StudentMode
            unitId={studentUnitId}
            authUser={authUser}
            onLogout={handleLogout}
            onExit={() => setStudentUnitId(null)} // back to unit picker
          />
          <ThemeToggle theme={theme} onToggle={() => setTheme((current) => current === 'dark' ? 'light' : 'dark')} />
        </>
      );
    }
    // Otherwise show the grade-filtered unit picker
    return (
      <>
        <StudentHome
          authUser={authUser}
          onSelectUnit={(id) => setStudentUnitId(id)}
          onLogout={handleLogout}
        />
        <ThemeToggle theme={theme} onToggle={() => setTheme((current) => current === 'dark' ? 'light' : 'dark')} />
      </>
    );
  }

  // Teacher clicking "Student Mode" → show gate instead of auto-switching
  if (showStudentGate && activeUnit) {
    return (
      <>
        {/* Keep teacher UI in background, dim it */}
        <StudentModeGate
          onSuccess={(student) => {
            setGateStudent(student);
            setShowStudentGate(false);
            setCurrentView('unit_student');
          }}
          onCancel={() => setShowStudentGate(false)}
        />
        <ThemeToggle theme={theme} onToggle={() => setTheme((current) => current === 'dark' ? 'light' : 'dark')} />
      </>
    );
  }

  // If teacher is in student mode (after gate login), render full-screen student view
  if (currentView === 'unit_student' && activeUnit) {
    return (
      <>
        <StudentMode
          unitId={activeUnit.id}
          authUser={gateStudent}
          onExit={handleExitStudentPreview}
          onLogout={handleExitStudentPreview}
        />
        <ThemeToggle theme={theme} onToggle={() => setTheme((current) => current === 'dark' ? 'light' : 'dark')} />
      </>
    );
  }

  return (
    <div className="app-shell flex min-h-screen bg-slate-50 font-sans text-slate-900 antialiased">
      {/* Global Sidebar Navigation */}
      <Sidebar
        currentView={currentView}
        onNavigate={handleNavigate}
        activeUnit={activeUnit}
        onLoadDemo={handleLoadDemo}
        authUser={authUser}
        onLogout={handleLogout}
      />

      {/* Main Workspace Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          unit={activeUnit}
          approvedCount={approvedCount}
          totalCount={5}
          qualityIssuesCount={qualityIssuesCount}
          onNavigate={handleNavigate}
          activeView={currentView}
        />

        <main className="flex-1 overflow-y-auto">
          {currentView === 'dashboard' && (
            <Dashboard
              onNavigate={handleNavigate}
              onSelectUnit={(unit) => {
                setActiveUnit(unit);
                fetchActiveUnitMetrics(unit.id);
              }}
            />
          )}

          {currentView === 'units' && (
            <UnitsList
              onNavigate={handleNavigate}
              onSelectUnit={(unit) => {
                setActiveUnit(unit);
                fetchActiveUnitMetrics(unit.id);
              }}
            />
          )}

          {currentView === 'unit_new' && (
            <CreateUnit
              onNavigate={handleNavigate}
              onSelectUnit={(unit) => {
                setActiveUnit(unit);
                fetchActiveUnitMetrics(unit.id);
              }}
            />
          )}

          {currentView === 'unit_overview' && activeUnit && (
            <UnitOverview
              unitId={activeUnit.id}
              onNavigate={handleNavigate}
            />
          )}

          {currentView === 'unit_source' && activeUnit && (
            <SourceWorkspace
              unitId={activeUnit.id}
              onNavigate={handleNavigate}
            />
          )}

          {currentView === 'unit_objectives' && activeUnit && (
            <ObjectivesView
              unitId={activeUnit.id}
              onNavigate={handleNavigate}
            />
          )}

          {currentView === 'unit_generate' && activeUnit && (
            <GenerateScreen
              unitId={activeUnit.id}
              initialUnit={activeUnit}
              onNavigate={handleNavigate}
            />
          )}

          {currentView === 'unit_pack' && activeUnit && (
            <PackOverview
              unitId={activeUnit.id}
              onNavigate={handleNavigate}
            />
          )}

          {currentView === 'unit_asset' && activeUnit && selectedAssetId && (
            <AssetReview
              unitId={activeUnit.id}
              assetId={selectedAssetId}
              onNavigate={handleNavigate}
            />
          )}

          {currentView === 'unit_quality' && activeUnit && (
            <QualityDashboard
              unitId={activeUnit.id}
              onNavigate={handleNavigate}
            />
          )}

          {currentView === 'unit_alignment' && activeUnit && (
            <AlignmentMap
              unitId={activeUnit.id}
            />
          )}

          {currentView === 'unit_versions' && activeUnit && (
            <VersionHistory
              unitId={activeUnit.id}
            />
          )}

          {currentView === 'review_queue' && (
            <ReviewQueue
              onNavigate={handleNavigate}
            />
          )}

          {currentView === 'unit_export' && activeUnit && (
            <ExportCenter
              unitId={activeUnit.id}
            />
          )}
        </main>
      </div>
      <ThemeToggle theme={theme} onToggle={() => setTheme((current) => current === 'dark' ? 'light' : 'dark')} />
    </div>
  );
}
