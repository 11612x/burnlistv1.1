<div style={{ marginTop: 20, textAlign: "left" }}>
  <button
    onClick={() => setEditMode(!editMode)}
    style={{
      background: "none",
      border: "none",
      color: "#0de309",
      cursor: "pointer",
      fontFamily: "'Courier New', Courier, monospace",
      textDecoration: "underline",
      fontSize: "1rem",
      userSelect: "none",
    }}
  >
    {editMode ? "done" : "edit"}
  </button>
</div>