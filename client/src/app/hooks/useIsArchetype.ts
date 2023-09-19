import { useLocation } from "react-router-dom";

const useIsArchetype = () => useLocation().pathname.includes("/archetypes/");

export default useIsArchetype;
