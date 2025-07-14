import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import NotificationBanner from '@components/NotificationBanner';
import CustomButton from '@components/CustomButton';
import { useTheme } from '../ThemeContext';

const CRT_GREEN = 'rgb(140,185,162)';

const UniverseHomePage = () => {
  const [universes, setUniverses] = useState({});
  const [notification, setNotification] = useState('');
  const [notificationType, setNotificationType] = useState('info');
  const [editMode, setEditMode] = useState(false);
  const [justClicked, setJustClicked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const { isInverted } = useTheme();

  // Load universes from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("burnlist_universes");
      if (saved) {
        const parsed = JSON.parse(saved);
        setUniverses(parsed);
      }
    } catch (error) {
      console.error("Failed to load universes:", error);
    }
  }, []);

  // Save universes to localStorage when they change
  useEffect(() => {
    localStorage.setItem("burnlist_universes", JSON.stringify(universes));
  }, [universes]);

  const handleCreateUniverse = () => {
    setJustClicked(true);
    setTimeout(() => setJustClicked(false), 150);
    
    const currentDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
    
    const universeName = `Universe ${currentDate}`;
    const universeId = uuidv4();
    const universeSlug = universeName.toLowerCase().replace(/[^a-z0-9]/g, '-');
    
    // Check if name already exists (case-insensitive)
    const exists = Object.values(universes).some(u => u.name && u.name.toLowerCase() === universeName.toLowerCase());
    if (exists) {
      setNotification('⚠️ Universe name already exists');
      setNotificationType('error');
      return;
    }
    
    const newUniverse = {
      id: universeId,
      name: universeName,
      slug: universeSlug,
      items: [],
      reason: '',
      createdAt: new Date().toISOString(),
    };
    
    const updated = { ...universes, [universeId]: newUniverse };
    setUniverses(updated);
    localStorage.setItem('burnlist_universes', JSON.stringify(updated));
    setNotification('');
  };

  const handleDeleteUniverse = (id) => {
    const keyToDelete = Object.keys(universes).find(key => universes[key].id === id);
    
    if (!keyToDelete) {
      console.log('🗑️ Could not find universe with id:', id);
      return;
    }
    
    const { [keyToDelete]: deleted, ...remaining } = universes;
    setUniverses(remaining);
    localStorage.setItem("burnlist_universes", JSON.stringify(remaining));
    if (deleted) {
      console.log('🗑️ Deleted universe:', deleted.name);
    } else {
      console.log('🗑️ Deleted universe with id:', id);
    }
  };

  const handleUpdateUniverseName = useCallback((id, newName) => {
    // Prevent duplicate names (case-insensitive, except for current)
    const duplicate = Object.values(universes).some(u => u.id !== id && u.name && u.name.toLowerCase() === newName.toLowerCase());
    if (duplicate) {
      setNotification('⚠️ Name already exists');
      setNotificationType('error');
      return;
    }
    setUniverses((prev) => {
      const updated = { ...prev };
      if (updated[id]) {
        updated[id] = { ...updated[id], name: newName, slug: newName.toLowerCase().replace(/[^a-z0-9]/g, '-') };
      }
      localStorage.setItem('burnlist_universes', JSON.stringify(updated));
      return updated;
    });
  }, [setUniverses, universes]);

  const handleUpdateUniverseReason = useCallback((id, newReason) => {
    const updated = {
      ...universes,
      [id]: {
        ...universes[id],
        reason: newReason
      }
    };
    setUniverses(updated);
    localStorage.setItem('burnlist_universes', JSON.stringify(updated));
  }, [setUniverses, universes]);

  // Track editing state and previous name for each universe
  const [editingNames, setEditingNames] = useState({}); // { [id]: { value, prev } }

  // When entering edit mode, initialize editingNames
  useEffect(() => {
    if (editMode) {
      const initial = {};
      Object.values(universes).forEach(u => {
        initial[u.id] = { value: u.name, prev: u.name };
      });
      setEditingNames(initial);
    } else {
      setEditingNames({});
    }
  }, [editMode, universes]);

  // Handler for input change (just update local state)
  const handleEditNameInput = (id, value) => {
    setEditingNames(prev => ({ ...prev, [id]: { ...prev[id], value } }));
  };

  // Handler for blur or 'Done' (validate and commit)
  const commitEditName = (id) => {
    const newName = editingNames[id]?.value || '';
    // Prevent duplicate names (case-insensitive, except for current)
    const duplicate = Object.values(universes).some(u => u.id !== id && u.name && u.name.toLowerCase() === newName.toLowerCase());
    if (duplicate) {
      setNotification('⚠️ Name already exists');
      setNotificationType('error');
      // Revert to previous name
      setEditingNames(prev => ({ ...prev, [id]: { ...prev[id], value: prev[id].prev } }));
      return;
    }
    // Commit the name change
    setUniverses((prev) => {
      const updated = { ...prev };
      if (updated[id]) {
        updated[id] = { ...updated[id], name: newName, slug: newName.toLowerCase().replace(/[^a-z0-9]/g, '-') };
      }
      localStorage.setItem('burnlist_universes', JSON.stringify(updated));
      return updated;
    });
    setEditingNames(prev => ({ ...prev, [id]: { ...prev[id], prev: newName } }));
  };

  const sortedUniverses = useMemo(() => Object.values(universes), [universes]);

  return (
    <div style={{ fontFamily: 'Courier New', color: isInverted ? 'black' : CRT_GREEN, backgroundColor: isInverted ? 'rgb(140,185,162)' : 'black', minHeight: '100vh', padding: '32px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <strong style={{ fontSize: '170%' }}>UNIVERSE SCREENER</strong>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span>UNIVERSES: {Object.keys(universes).length}</span>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <style>
          {`
            .clicked-button {
              background-color: black !important;
              color: ${CRT_GREEN} !important;
            }
          `}
        </style>
        <Link to="/" style={{ textDecoration: 'none' }}>
          <CustomButton
            style={{
              backgroundColor: 'black',
              color: CRT_GREEN,
              border: `1px solid ${CRT_GREEN}`
            }}
          >
            BURNPAGE
          </CustomButton>
        </Link>
        <CustomButton
          onClick={handleCreateUniverse}
          className={justClicked ? 'clicked-button' : ''}
          style={{
            backgroundColor: CRT_GREEN,
            color: 'black',
            transition: 'all 0.2s ease-in-out'
          }}
        >
          +++
        </CustomButton>

        <CustomButton
          onClick={() => {
            setEditMode(!editMode);
            console.log('🛠️ Edit mode:', !editMode);
          }}
          style={{
            backgroundColor: editMode ? CRT_GREEN : 'black',
            color: editMode ? 'black' : CRT_GREEN,
          }}
        >
          {editMode ? 'DONE' : 'EDIT'}
        </CustomButton>
      </div>

      {/* Centralized Notification Banner */}
      {notification && (
        <div style={{ position: 'fixed', top: 24, left: 0, right: 0, zIndex: 10001, display: 'flex', justifyContent: 'center', pointerEvents: 'none' }}>
          <div style={{ minWidth: 320, maxWidth: 480, pointerEvents: 'auto' }}>
            <NotificationBanner
              message={notification}
              type={notificationType}
              onClose={() => setNotification('')}
            />
          </div>
        </div>
      )}

      {/* Loading and error banners */}
      {isLoading && (
        <NotificationBanner 
          message="Loading universes..." 
          type="loading" 
        />
      )}
      {error && (
        <NotificationBanner 
          message={error} 
          type="error" 
          onClose={() => setError(null)} 
        />
      )}

      {Object.keys(universes).length === 0 && (
        <p style={{ textAlign: 'center', color: '#999', marginTop: '50px' }}>
          No universes found. Create your first universe to get started.
        </p>
      )}

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(5, 252px)',
        rowGap: '20px',
        columnGap: '20px',
        margin: '70px 0 1px 0',
        justifyContent: 'center',
        alignItems: 'start',
      }}>
        {sortedUniverses.map((universe, idx) => {
          const tickers = universe.items || [];
                     const cardContent = (
             <div style={{
               width: 252,
               height: editMode ? 250 : 120,
               fontFamily: 'Courier New',
               background: 'transparent',
               padding: '10px 8px',
               margin: 0,
               border: `1px solid ${CRT_GREEN}`,
               borderRadius: 0,
               boxShadow: 'none',
               display: 'flex',
               flexDirection: 'column',
               alignItems: 'stretch',
               justifyContent: 'flex-start',
               position: 'relative',
               boxSizing: 'border-box',
               overflow: 'hidden',
             }}>
              {/* Name (editable) */}
              {editMode ? (
                <input
                  value={editingNames[universe.id]?.value ?? universe.name}
                  onChange={e => handleEditNameInput(universe.id, e.target.value)}
                  onBlur={() => commitEditName(universe.id)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      commitEditName(universe.id);
                    }
                  }}
                  style={{
                    fontFamily: 'Courier New',
                    fontSize: 18,
                    color: CRT_GREEN,
                    background: 'black',
                    border: '1px solid #333',
                    marginBottom: 4,
                    padding: '2px 4px',
                    width: '100%',
                    fontWeight: 'bold',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                />
              ) : (
                <div style={{ fontSize: 18, color: CRT_GREEN, fontWeight: 'bold', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {universe.name || `UNIVERSE ${idx + 1}`}
                </div>
              )}
              {/* Delete button (only in edit mode) */}
              {editMode && (
                <CustomButton
                  onClick={() => handleDeleteUniverse(universe.id)}
                  style={{
                    backgroundColor: 'black',
                    color: '#e31507',
                    border: '1px solid #e31507',
                    padding: '2px 6px',
                    marginBottom: 4,
                    fontSize: 10,
                    width: '100%',
                    fontWeight: 'bold'
                  }}
                >
                  DELETE
                </CustomButton>
              )}
              {/* Reason (editable) */}
              {editMode ? (
                <input
                  value={universe.reason || ''}
                  onChange={e => handleUpdateUniverseReason(universe.id, e.target.value)}
                  style={{
                    fontFamily: 'Courier New',
                    fontSize: 14,
                    color: CRT_GREEN,
                    background: 'black',
                    border: '1px solid #333',
                    marginBottom: 4,
                    padding: '2px 4px',
                    width: '100%',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                  placeholder="Reason..."
                />
              ) : (
                <div style={{ fontSize: 14, color: CRT_GREEN, marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {universe.reason || 'N/A'}
                </div>
              )}
              {/* Universe info */}
              <div style={{ fontSize: 13, color: CRT_GREEN, marginBottom: 2 }}>
                {tickers.length} tickers
              </div>
              {/* Created date */}
              <div style={{ fontSize: 11, color: '#888', marginBottom: 2 }}>
                {new Date(universe.createdAt).toLocaleDateString()}
              </div>
                             {/* Status */}
               <div style={{ fontSize: 19, color: CRT_GREEN, fontWeight: 'bold', marginBottom: 2 }}>
                 {tickers.length > 0 ? 'ACTIVE' : 'EMPTY'}
               </div>
            </div>
          );
          return (
            <div key={universe.id} style={{ margin: 0 }}>
              {editMode ? cardContent : (
                <Link to={`/universe/${universe.slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                  {cardContent}
                </Link>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default UniverseHomePage; 