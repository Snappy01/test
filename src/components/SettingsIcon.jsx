import './SettingsIcon.css'

const SettingsIcon = ({ className = "w-5 h-5" }) => {
  return (
    <svg
      className={`settings-gear-icon ${className}`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* Roue crantée qui tourne */}
      <g className="gear-rotating">
        {/* Cercle central */}
        <circle
          cx="12"
          cy="12"
          r="3"
        />
        {/* Forme de l'engrenage avec dents arrondies */}
        {/* Dents principales (8 dents) */}
        <path
          d="M12 3 L13 7 L14.5 7 L15 9 L17 8.5 L17.5 10 L19.5 10 L20 12 L19.5 14 L17.5 14 L17 15.5 L15 15 L14.5 17 L13 17 L12 21 L11 17 L9.5 17 L9 15 L7 15.5 L6.5 14 L4.5 14 L4 12 L4.5 10 L6.5 10 L7 8.5 L9 9 L9.5 7 L11 7 Z"
        />
      </g>
    </svg>
  )
}

export default SettingsIcon

