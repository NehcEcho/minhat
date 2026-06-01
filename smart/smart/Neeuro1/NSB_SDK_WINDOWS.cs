using System;
using System.Configuration;
using System.Diagnostics;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.Runtime.InteropServices;
using System.Windows.Forms;
using NeeuroOSWindows;

namespace NSB_SDK
{
    public partial class NSB_SDK : Form
    {
//Initialization & setup
        public NSB_SDK()
        {
            InitializeComponent();
        }

        EEGGrapher grapher = new EEGGrapher();
        void Form_Load(object sender, EventArgs e)
        {
            SenzeBandWindowsInterface.getSBWIHandler().replaceBTStatus(GetBTStatus);
            SenzeBandWindowsInterface.getSBWIHandler().initializeSBWI(connectedCallBack, connectFailCallBack, ConfigurationManager.AppSettings["DeveloperCode"], completedInitialization, errorLog);
            this.Text = "IPC Client " + "STANDARD";

            AuthenticationStatus.Text = string.Format("Authentication: {0}", "False");

            grapher.control = pictureBox1;          
        }
        
        private void pictureBox1_Paint(object sender, System.Windows.Forms.PaintEventArgs e)
        {
            grapher.Draw(e);
        }

        //Callback functions for scan and connect
        void completedInitialization()
        {
            Debug.WriteLine("Initialization Completed");
            initialize(); //from the EEG controller
        }

        bool btStatus = false;
        void GetBTStatus(bool status)
        {
            btStatus = status;
        }

        void errorLog(string temp)
        {
            var timestamp = "[" + DateTime.Now.ToUniversalTime() + "] ";
            //Log of error message from SenzeBandWindowsInterface
            Debug.WriteLine("SBWI: " + timestamp + temp);
        }

        void receiveScanResult(ScannedDeviceClass scanCallBack, bool addDevice)
        {
            Debug.WriteLine("Receive scan result, Add Device?"+addDevice);

            //We need this to ensure that the listViewDevices is on the same thread as created from.
            if (InvokeRequired)
            {
                Action<ScannedDeviceClass, bool> func = receiveScanResult;
                Invoke(func, scanCallBack, addDevice);
                return;
            }

            if (addDevice)
            {
                //For each item scanned, we create it on the list view. 
                //We can also put everything into a List<scannedDeviceClass> if we don't have a UI
                
                //existing item in list
                foreach(ListViewItem it in listViewDevices.Items)
                {
                    if(String.Compare(it.Tag.ToString(), scanCallBack.deviceID) == 0)
                    {
                        it.SubItems[0].Text = scanCallBack.deviceName;
                        it.SubItems[1].Text = scanCallBack.deviceID;
                        //it.SubItems[1].Text = scanCallBack.isPaired.ToString();
                        it.SubItems[2].Text = scanCallBack.canPair.ToString();
                        it.SubItems[3].Text = scanCallBack.isConnected.ToString();
                        it.SubItems[4].Text = scanCallBack.deviceAddress;
                        //it.SubItems[4].Text = scanCallBack.isEnabled.ToString();
                        return;
                    }
                }
                //new item for list
                ListViewItem item = listViewDevices.Items.Add(scanCallBack.deviceName);
                item.SubItems.Add(scanCallBack.deviceID);
                //item.SubItems.Add(scanCallBack.isPaired.ToString());
                item.SubItems.Add(scanCallBack.canPair.ToString());
                item.SubItems.Add(scanCallBack.isConnected.ToString());
                item.SubItems.Add(scanCallBack.deviceAddress);
                //item.SubItems.Add(scanCallBack.isEnabled.ToString());

                item.Tag = scanCallBack.deviceID; //We will need this to connect

                buttonConnectDevice.Enabled = true;
            }
            else
            {
                //Remove device from list
                for(int i = 0; i < listViewDevices.Items.Count; ++i)
                {
                    //If the deviceID is equal, then we remove it from the list.
                    if(String.Compare(listViewDevices.Items[i].Tag.ToString(), scanCallBack.deviceID) == 0)
                    {
                        listViewDevices.Items.RemoveAt(i);
                        --i;
                    }
                }
            }
        }

        void SetDevcode(string code)
        {
            SenzeBandWindowsInterface.getSBWIHandler().SetDevcode(code);
            //SenzeBandWindowsInterface.getSBWIHandler().initializeSBWI(connectedCallBack, connectFailCallBack, code, completedInitialization, errorLog);
        }

        void updateScanResult(ScannedDeviceClass scanResult)
        {
            //This callback function is called when there's a change to the scanned items' status.
            //Such as when the SenzeBand changes from "not connected" to "connected"
            Debug.WriteLine("Receive scan update: " + scanResult.deviceID);

            //We need this to ensure that the listViewDevices is on the same thread as created from.
            if (InvokeRequired)
            {
                Action<ScannedDeviceClass> func = updateScanResult;
                Invoke(func, scanResult);
                return;
            }

            for (int i = 0; i < listViewDevices.Items.Count; ++i)
            {
                if (String.Compare(listViewDevices.Items[i].Tag.ToString(), scanResult.deviceID) == 0)
                {
                    listViewDevices.Items[i].SubItems[0].Text = scanResult.deviceName;
                    listViewDevices.Items[i].SubItems[1].Text = scanResult.deviceID;
                    //listViewDevices.Items[i].SubItems[2].Text = scanResult.isPaired.ToString();
                    listViewDevices.Items[i].SubItems[2].Text = scanResult.canPair.ToString();
                    listViewDevices.Items[i].SubItems[3].Text = scanResult.isConnected.ToString();
                    listViewDevices.Items[i].SubItems[4].Text = scanResult.deviceAddress;
                    //listViewDevices.Items[i].SubItems[5].Text = scanResult.isEnabled.ToString();

                    listViewDevices.Items[i].Tag = scanResult.deviceID;
                    return;
                }
            }
        }

        string last_connected_deviceID = "";
        void connectedCallBack(string address, string ID, bool hasExistingConnection)
        {
            if (InvokeRequired)
            {
                Action<string,string,bool> func = connectedCallBack;
                Invoke(func, address, ID, hasExistingConnection);
                return;
            }

            //hasExistingConnection 
            //  - True when there is already an existing SenzeBand connection. 
            //  - False when otherwise.
            //  For status update
            if (hasExistingConnection)
                return;

            Debug.WriteLine("Connection succeed for " + address);
            DeviceLabel.Text = ID;
            buttonConnectDevice.Enabled = false;
            buttonDisconnectDevice.Enabled = true;
            last_connected_deviceID = ID;

            //AuthenticationStatus.Text = string.Format("Authentication: {0}", "False");

            //Delete other scanned device from the list, as scanning has stopped
            for (int i = 0; i < listViewDevices.Items.Count; ++i)
            {
                if (String.Compare(listViewDevices.Items[i].Tag.ToString(), address) != 0)
                {
                    listViewDevices.Items.RemoveAt(i);
                    --i;
                }
                else
                {
                    // update paired status for senzeband we connected to
                    listViewDevices.Items[i].SubItems[2].Text = "False";
                    listViewDevices.Items[i].SubItems[3].Text = "True";
                }
            }
        }

        void connectFailCallBack(string address)
        {
            Debug.WriteLine("Connection fail or disconnect for " + address);
            if (InvokeRequired)
            {
                Action<string> func = connectFailCallBack;
                Invoke(func, address);
                return;
            }
            //Debug.WriteLine("Connection fail or disconnect for " + address);
            buttonConnectDevice.Enabled = true;
            buttonDisconnectDevice.Enabled = false;

            //Delete all device from the list
            for (int i = 0; i < listViewDevices.Items.Count; ++i)
            {
                listViewDevices.Items.RemoveAt(i);
                --i;
            }
        }

        void enumerationComplete()
        {

        }

//User initiated action 
        void button_startScanButton(object sender, EventArgs e)
        {
            Debug.WriteLine("Starting Scan now");
            //SenzeBandWindowsInterface.getSBWIHandler().startScanning(receiveScanResult, updateScanResult, enumerationComplete);
            //  receiveScanResult()     - Callback for detecting a Neeuro SenzeBand added or removed in the scan list 
            //  updateScanResult()      - Callback when a property change is detected in the scan list (eg. when a SenzeBand becomes connected)
            //  enumerationComplete()   - Callback when the scanning process is completed 
            bool bStartScan = SenzeBandWindowsInterface.getSBWIHandler().startScanning(receiveScanResult, updateScanResult, enumerationComplete);
            if (bStartScan)
            {
                buttonStartScan.Enabled = false;
                buttonStopScan.Enabled = true;
                //Delete previous scanned device from the displayed list
                for (int i = 0; i < listViewDevices.Items.Count; ++i)
                {
                     listViewDevices.Items.RemoveAt(i);
                     --i;
                }
            }
            else
            {
                Debug.WriteLine("Unable to start scan.");
            }
        }

        void button_stopScanButton(object sender, EventArgs e)
        {
            Debug.WriteLine("Stopping Scan now");
            SenzeBandWindowsInterface.getSBWIHandler().stopScanning();
            buttonStartScan.Enabled = true;
            buttonStopScan.Enabled = false;
        }

        void ConnectDevice(string deviceid)
        {
            Debug.WriteLine("Connecting device " + deviceid);
            SenzeBandWindowsInterface.getSBWIHandler().connectBT(deviceid);

            buttonConnectDevice.Enabled = false;
            buttonDisconnectDevice.Enabled = true;

            Debug.WriteLine("Stop Scan for new devices");   //Scanning for new devices stopped, but current device's status is still monitored
            buttonStartScan.Enabled = true;
            buttonStopScan.Enabled = false;
            SenzeBandWindowsInterface.getSBWIHandler().stopScanning();
        }

        void button_ConnectDevice(object sender, EventArgs e)
        {
            if (listViewDevices.SelectedItems.Count != 1)
            {
                Debug.WriteLine("Please only select 1 item!");
                return;
            }

            var deviceid = listViewDevices.SelectedItems[0].Tag.ToString();
            ConnectDevice(deviceid);
        }

        void button_DisconnectDevice(object sender, EventArgs e)
        {
            if (listViewDevices.SelectedItems.Count != 1)
            {
                Debug.WriteLine("Please only select 1 item!");
                return;
            }

            //We can either use the listViewDevices.SelectedItems[0].Tag 
            //or we store the connected device in a variable and use it to disconnect
            Debug.WriteLine("Disconnecting device " + listViewDevices.SelectedItems[0].Tag.ToString());
            SenzeBandWindowsInterface.getSBWIHandler().disconnectBT(listViewDevices.SelectedItems[0].Tag.ToString());

            ClearCachedEEGData();
            grapher.ClearAllData();
            grapher.SignalDataReadyForDraw();
        }

        private void ARW_CheckedChanged(object sender, EventArgs e)
        {
            if (ARWCheckbox.Checked == true)
            {
                ABDTCheckbox.Checked = false;
            }

            UpdateGraphs();
        }

        private void ABDT_CheckedChanged(object sender, EventArgs e)
        {
            if (ABDTCheckbox.Checked == true)
            {
                ARWCheckbox.Checked = false;
            }

            UpdateGraphs();
        }

        private void EEG_CheckedChanged(object sender, EventArgs e)
        {
            UpdateGraphs();
        }

        void UpdateGraphs()
        {
            grapher.ClearAllData();

            if (ARWCheckbox.Checked == true)
            {
                attentionLabel.BackColor = Color.Red;
                attentionLabel.ForeColor = Color.White;
                relaxationLabel.BackColor = Color.Green;
                relaxationLabel.ForeColor = Color.White;
                workloadLabel.BackColor = Color.Blue;
                workloadLabel.ForeColor = Color.White;

                grapher.UpdateData(Pens.Red, att_data);
                grapher.UpdateData(Pens.Green, rel_data);
                grapher.UpdateData(Pens.Blue, wor_data);
            }
            else
            {
                attentionLabel.BackColor = Color.Transparent;
                attentionLabel.ForeColor = Color.Black;
                relaxationLabel.BackColor = Color.Transparent;
                relaxationLabel.ForeColor = Color.Black;
                workloadLabel.BackColor = Color.Transparent;
                workloadLabel.ForeColor = Color.Black;

                deltaLabel.ForeColor = Color.Black;
                deltaLabel.BackColor = Color.Transparent;
                thetaLabel.ForeColor = Color.Black;
                thetaLabel.BackColor = Color.Transparent;
                alphaLabel.ForeColor = Color.Black;
                alphaLabel.BackColor = Color.Transparent;
                betaLabel.ForeColor = Color.Black;
                betaLabel.BackColor = Color.Transparent;
                gammaLabel.ForeColor = Color.Black;
                gammaLabel.BackColor = Color.Transparent;
            }

            if (ABDTCheckbox.Checked == true)
            {
                deltaLabel.ForeColor = Color.White;
                deltaLabel.BackColor = Color.Red;
                thetaLabel.ForeColor = Color.White;
                thetaLabel.BackColor = Color.Green;
                alphaLabel.ForeColor = Color.White;
                alphaLabel.BackColor = Color.Blue;
                betaLabel.ForeColor = Color.White;
                betaLabel.BackColor = Color.Orange;
                gammaLabel.ForeColor = Color.White;
                gammaLabel.BackColor = Color.Purple;

                attentionLabel.BackColor = Color.Transparent;
                attentionLabel.ForeColor = Color.Black;
                relaxationLabel.BackColor = Color.Transparent;
                relaxationLabel.ForeColor = Color.Black;
                workloadLabel.BackColor = Color.Transparent;
                workloadLabel.ForeColor = Color.Black;

                grapher.UpdateData(Pens.Red, delta_data, true);
                grapher.UpdateData(Pens.Green, theta_data, true);
                grapher.UpdateData(Pens.Blue, alpha_data, true);
                grapher.UpdateData(Pens.Orange, beta_data, true);
                grapher.UpdateData(Pens.Purple, gamma_data, true);
            }
            else
            {
                deltaLabel.ForeColor = Color.Black;
                deltaLabel.BackColor = Color.Transparent;
                thetaLabel.ForeColor = Color.Black;
                thetaLabel.BackColor = Color.Transparent;
                alphaLabel.ForeColor = Color.Black;
                alphaLabel.BackColor = Color.Transparent;
                betaLabel.ForeColor = Color.Black;
                betaLabel.BackColor = Color.Transparent;
                gammaLabel.ForeColor = Color.Black;
                gammaLabel.BackColor = Color.Transparent;
            }            

            if(EEG_Check.Checked)
            {
                grapher.UpdateData(Pens.Gray, eeg_data, true);
            }

            grapher.SignalDataReadyForDraw();
        }

        protected override void OnFormClosing(FormClosingEventArgs e)
        {
            base.OnFormClosing(e);
            SenzeBandWindowsInterface.getSBWIHandler().shutdownSBWI();
        }

        private void authButton_Click(object sender, EventArgs e)
        {
            DeviceAuthentication.instance.getAuthentication();
        }

        private void RedButton_Click(object sender, EventArgs e)
        {
            string command = "COMMAND_LIGHT_RED";
            SenzeBandWindowsInterface.getSBWIHandler().sendCommand(command);
        }

        private void GreenButton_Click(object sender, EventArgs e)
        {
            string command = "COMMAND_LIGHT_GREEN";
            SenzeBandWindowsInterface.getSBWIHandler().sendCommand(command);
        }

        private void BlueButton_Click(object sender, EventArgs e)
        {
            string command = "COMMAND_LIGHT_BLUE";
            SenzeBandWindowsInterface.getSBWIHandler().sendCommand(command);
        }

        private void CyanButton_Click(object sender, EventArgs e)
        {
            string command = "COMMAND_LIGHT_CYAN";
            SenzeBandWindowsInterface.getSBWIHandler().sendCommand(command);
        }

        private void MagentaButton_Click(object sender, EventArgs e)
        {
            string command = "COMMAND_LIGHT_MAGENTA";
            SenzeBandWindowsInterface.getSBWIHandler().sendCommand(command);
        }

        private void YellowButton_Click(object sender, EventArgs e)
        {
            string command = "COMMAND_LIGHT_YELLOW";
            SenzeBandWindowsInterface.getSBWIHandler().sendCommand(command);
        }

        private void stopRGBButton_Click(object sender, EventArgs e)
        {
            string command = "COMMAND_STOP_RGB";
            SenzeBandWindowsInterface.getSBWIHandler().sendCommand(command);
        }

        private void StartButton_Click(object sender, EventArgs e)
        {
            string command = "COMMAND_START";
            SenzeBandWindowsInterface.getSBWIHandler().sendCommand(command);
        }

        private void StopButton_Click(object sender, EventArgs e)
        {
            string command = "COMMAND_STOP";
            SenzeBandWindowsInterface.getSBWIHandler().sendCommand(command);
        }

        private void PPGStartButton_Click(object sender, EventArgs e)
        {
            string command = "COMMAND_PPG_START";
            SenzeBandWindowsInterface.getSBWIHandler().sendCommand(command);
        }

        private void PPGStopButton_Click(object sender, EventArgs e)
        {
            string command = "COMMAND_PPG_STOP";
            SenzeBandWindowsInterface.getSBWIHandler().sendCommand(command);
        }

        private void label3_Click(object sender, EventArgs e)
        {

        }

        private void FWVERButton_Click(object sender, EventArgs e)
        {
            string command = "COMMAND_FW_VER";
            SenzeBandWindowsInterface.getSBWIHandler().sendCommand(command);
        }

        private void CalStartButton_Click(object sender, EventArgs e)
        {
            string command = "COMMAND_CAL_START";
            SenzeBandWindowsInterface.getSBWIHandler().sendCommand(command);
        }

        private void CalStopButton_Click(object sender, EventArgs e)
        {
            string command = "COMMAND_CAL_STOP";
            SenzeBandWindowsInterface.getSBWIHandler().sendCommand(command);
        }

        private void EvokeButton_Click(object sender, EventArgs e)
        {
            string command = "COMMAND_CMD_FA";
            SenzeBandWindowsInterface.getSBWIHandler().sendCommand(command);
        }

        private void DCButton_Click(object sender, EventArgs e)
        {
            string command = "COMMAND_DC_LEADOFF";
            SenzeBandWindowsInterface.getSBWIHandler().sendCommand(command);
        }

        private void ACbutton_Click(object sender, EventArgs e)
        {
            string command = "COMMAND_AC_LEADOFF";
            SenzeBandWindowsInterface.getSBWIHandler().sendCommand(command);
        }
    }
}
