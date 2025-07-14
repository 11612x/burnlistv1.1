import React from 'react';
import { useThemeColor } from '../ThemeContext';

const CRT_GREEN = 'rgb(140,185,162)';

const EditToggleButton = ({ editMode, setEditMode }) => {
  const green = useThemeColor(CRT_GREEN);
  const black = useThemeColor('black');
  return (
    <div style={{ marginTop: 0, textAlign: "right" }}>
      <button
        onClick={() => setEditMode(!editMode)}
        style={{
          background: editMode ? green : black,
          border: `1px solid ${green}`,
          color: editMode ? black : green,
          cursor: "pointer",
          fontFamily: "'Courier New', Courier, monospace",
          textDecoration: "none",
          fontSize: "1rem",
          padding: "4px 8px",
          userSelect: "none",
          transition: 'all 0.2s',
        }}
      >
        {editMode ? "done" : "edit"}
      </button>
    </div>
  );
};

export default EditToggleButton;