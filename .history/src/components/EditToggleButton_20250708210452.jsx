<div style={{ marginTop: 20, textAlign: "left" }}>
  <button
    onClick={() => setEditMode(!editMode)}
    style={{
      background: "#000000",
      border: "1px solid #ffffff",
      color: "#0de309",
      cursor: "pointer",
      fontFamily: "'Courier New', Courier, monospace",
      textDecoration: "none",
      fontSize: "1rem",
      padding: "4px 8px",
      userSelect: "none",
    }}
  >
    {editMode ? "done" : "edit"}
  </button>
</div>