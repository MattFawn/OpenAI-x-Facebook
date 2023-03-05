RED='\033[0;31m'
NC='\033[0m'
BWhite='\033[1;37m'
Green='\033[0;32m'

clear
if [ -z "$OPENAI_SECRET_KEY" ]; then
  echo -e "${RED}OpenAI API key not found.${NC}"
  echo "Follow these steps to get one:"
  echo ""
  echo -e "1. Log-in to ${BWhite}https://platform.openai.com/${NC}"
  echo -e "2. Go to ${BWhite}https://platform.openai.com/account/api-keys${NC}"
  echo -e "3. Click ${Green}'Create new secret key'${NC}, and click copy"
  echo -e "4. Click the ${Green}'Secrets'${NC} at the tools section of this Repl"
  echo -e "5. At the ${Green}'key'${NC}, input ${Green}'OPENAI_SECRET_KEY'${NC}"
  echo -e "6. At the ${Green}'value'${NC}, paste the API key."
  echo -e "7. Click ${Green}'Add new secret'${NC}, and you're all set!"
elif [ $(wc -c < "customizable/appstate.json") -eq 0 ]; then
  echo -e "${RED}Appstate.json is empty${NC}"
  echo -e "Follow these steps to fix this:"
  echo ""
  echo -e "1. Download this file: ${BWhite}https://replit.com/@$REPL_OWNER/$REPL_SLUG#emergency/c3c-fbstate-1.4.zip${NC}"
  echo -e "2. Extract it."
  echo -e "3. If you're using Chrome, go to ${BWhite}chrome://extensions/${NC}"
  echo -e "   If you're using edge, go to ${BWhite}edge://extensions/${NC}"
  echo -e "4. Turn on the developer mode."
  echo -e "5. Click ${Green}'Load Unpacked'${NC}"
  echo -e "6. Choose the ${Green}'c3c-fbstate-1.4'${NC}"
  echo -e "7. Log-in to ${BWhite}https://web.facebook.com/?_rdc=1&_rdr${NC}"
  echo -e "8. Click the ${Green}'extensions'${NC} and click ${Green}'C3C FBState Utility'${NC}"
  echo -e "9. Click ${Green}'Export FBState'${NC} and ${Green}'Copy to clipboard'${NC}"
  echo -e "Go to ${BWhite}https://replit.com/@$REPL_OWNER/$REPL_SLUG#customizable/appstate.json${NC}"
  echo -e "Paste the FBState, and you're all set!"
elif grep -q "^name *= *''" customizable/settings.config; then
 echo -e "${RED}An error occured. Check if there's any empty variables at customizable/settings.config${NC}"
else
 node main.js
fi