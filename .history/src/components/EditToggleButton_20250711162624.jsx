import React from 'react';

const CRT_GREEN = 'rgb(140,185,162)';

const EditToggleButton = ({ editMode, setEditMode }) => {
  return (
    <div style={{ marginTop: 0, textAlign: "right" }}>
      <button
        onClick={() => setEditMode(!editMode)}
        style={{
          background: editMode ? CRT_GREEN : "#000000",
          border: `1px solid ${CRT_GREEN}`,
          color: editMode ? "black" : CRT_GREEN,
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