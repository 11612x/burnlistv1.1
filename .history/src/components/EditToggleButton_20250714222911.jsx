import React from 'react';
import { useThemeColor } from '../ThemeContext';
import CustomButton from './CustomButton';

const CRT_GREEN = 'rgb(140,185,162)';

const EditToggleButton = ({ editMode, setEditMode }) => {
  const green = useThemeColor(CRT_GREEN);
  const black = useThemeColor('black');
  return (
    <div style={{ marginTop: 0, textAlign: "right" }}>
      <CustomButton
        onClick={() => setEditMode(!editMode)}
        style={{
          background: 'transparent',
          color: green,
          border: `1px solid ${green}`,
          fontFamily: "'Courier New', monospace",
          textTransform: 'lowercase',
          fontWeight: 400,
          letterSpacing: 1,
          margin: 0,
          boxShadow: 'none',
          borderRadius: 2,
          fontSize: 15,
        }}
      >
        {editMode ? 'done' : 'edit'}
      </CustomButton>
    </div>
  );
};

export default EditToggleButton;