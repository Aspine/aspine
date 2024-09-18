sudo mv aspine.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable aspine.service
sudo systemctl start aspine.service