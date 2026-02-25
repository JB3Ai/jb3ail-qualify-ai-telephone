#!/bin/bash
# JB³Ai Neural Hub - Tactical Reset & Rebuild Script

echo "------------------------------------------------"
echo " JB³Ai NEURAL HUB: SYSTEM RECALIBRATION "
echo "------------------------------------------------"
echo "1) ERASE: Clear local lead database & cache"
echo "2) REBUILD: Reinstall dependencies & restart server"
echo "3) CALIBRATE: Link 'Mzanzi Engine' Call Section"
echo "4) EXIT"
echo "------------------------------------------------"
read -p "Select Protocol [1-4]: " choice

case $choice in
  1)
    echo "DELETING_LOCAL_SIGNAL_DATA..."
    rm -rf ./db/leads.json # Assuming your local storage file
    echo "CLEAN_SLATE_ESTABLISHED."
    ;;
  2)
    echo "INITIALIZING_REBUILD..."
    npm install
    npm run build
    echo "REBUILD_COMPLETE. Starting Engine..."
    npm run dev
    ;;
  3)
    read -p "Enter the exact Tab Name for the Mzanzi Engine (e.g., CALL_SECTION): " tab_name
    # This command finds the RANGE constant in your code and swaps the tab name
    sed -i "s/const RANGE = '.*!/const RANGE = '$tab_name!/g" server.ts
    echo "ENGINE_RECALIBRATED: Now pulling signals from the $tab_name tab."
    ;;
  4)
    exit 0
    ;;
esac
