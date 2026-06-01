namespace NSB_SDK
{
    partial class NSB_SDK
    {
        /// <summary>
        /// Required designer variable.
        /// </summary>
        private System.ComponentModel.IContainer components = null;

        /// <summary>
        /// Clean up any resources being used.
        /// </summary>
        /// <param name="disposing">true if managed resources should be disposed; otherwise, false.</param>
        protected override void Dispose(bool disposing)
        {
            if (disposing && (components != null))
            {
                components.Dispose();
            }
            base.Dispose(disposing);
        }

        #region Windows Form Designer generated code

        /// <summary>
        /// Required method for Designer support - do not modify
        /// the contents of this method with the code editor.
        /// </summary>
        private void InitializeComponent()
        {
            this.listViewDevices = new System.Windows.Forms.ListView();
            this.columnHeaderName = ((System.Windows.Forms.ColumnHeader)(new System.Windows.Forms.ColumnHeader()));
            this.columnHeaderID = ((System.Windows.Forms.ColumnHeader)(new System.Windows.Forms.ColumnHeader()));
            this.columnHeaderPairable = ((System.Windows.Forms.ColumnHeader)(new System.Windows.Forms.ColumnHeader()));
            this.columnHeaderConnected = ((System.Windows.Forms.ColumnHeader)(new System.Windows.Forms.ColumnHeader()));
            this.columnHeaderAddress = ((System.Windows.Forms.ColumnHeader)(new System.Windows.Forms.ColumnHeader()));
            this.ScannedDevicesLabel = new System.Windows.Forms.Label();
            this.buttonConnectDevice = new System.Windows.Forms.Button();
            this.buttonDisconnectDevice = new System.Windows.Forms.Button();
            this.buttonStartScan = new System.Windows.Forms.Button();
            this.buttonStopScan = new System.Windows.Forms.Button();
            this.ConnectedDeviceLabel = new System.Windows.Forms.Label();
            this.DeviceLabel = new System.Windows.Forms.Label();
            this.accXLabel = new System.Windows.Forms.Label();
            this.accYLabel = new System.Windows.Forms.Label();
            this.accZLabel = new System.Windows.Forms.Label();
            this.channel1Label = new System.Windows.Forms.Label();
            this.channel2Label = new System.Windows.Forms.Label();
            this.channel3Label = new System.Windows.Forms.Label();
            this.channel4Label = new System.Windows.Forms.Label();
            this.attentionLabel = new System.Windows.Forms.Label();
            this.relaxationLabel = new System.Windows.Forms.Label();
            this.batteryLabel = new System.Windows.Forms.Label();
            this.MCUIDLabel = new System.Windows.Forms.Label();
            this.SignalReadyLabel = new System.Windows.Forms.Label();
            this.ConnectionCheckLabel = new System.Windows.Forms.Label();
            this.AuthenticationStatus = new System.Windows.Forms.Label();
            this.pictureBox1 = new System.Windows.Forms.PictureBox();
            this.workloadLabel = new System.Windows.Forms.Label();
            this.alphaLabel = new System.Windows.Forms.Label();
            this.betaLabel = new System.Windows.Forms.Label();
            this.thetaLabel = new System.Windows.Forms.Label();
            this.gammaLabel = new System.Windows.Forms.Label();
            this.ARWCheckbox = new System.Windows.Forms.CheckBox();
            this.ABDTCheckbox = new System.Windows.Forms.CheckBox();
            this.EEG_Check = new System.Windows.Forms.CheckBox();
            this.deltaLabel = new System.Windows.Forms.Label();
            this.MCUIDValue = new System.Windows.Forms.Label();
            this.DevelopmentCodeBox = new System.Windows.Forms.TextBox();
            this.label1 = new System.Windows.Forms.Label();
            this.BTEnabledLabel = new System.Windows.Forms.Label();
            this.isBTEnabled = new System.Windows.Forms.Label();
            this.label2 = new System.Windows.Forms.Label();
            this.OSCPortInput = new System.Windows.Forms.TextBox();
            this.authButton = new System.Windows.Forms.Button();
            this.RedButton = new System.Windows.Forms.Button();
            this.GreenButton = new System.Windows.Forms.Button();
            this.BlueButton = new System.Windows.Forms.Button();
            this.CyanButton = new System.Windows.Forms.Button();
            this.MagentaButton = new System.Windows.Forms.Button();
            this.YellowButton = new System.Windows.Forms.Button();
            this.StopRGBButton = new System.Windows.Forms.Button();
            this.StartButton = new System.Windows.Forms.Button();
            this.StopButton = new System.Windows.Forms.Button();
            this.PPGStartButton = new System.Windows.Forms.Button();
            this.PPGStopButton = new System.Windows.Forms.Button();
            this.SPO2Label = new System.Windows.Forms.Label();
            this.HeartRateLabel = new System.Windows.Forms.Label();
            this.EvokeLabel = new System.Windows.Forms.Label();
            this.XGainLabel = new System.Windows.Forms.Label();
            this.YGainLabel = new System.Windows.Forms.Label();
            this.ZGainLabel = new System.Windows.Forms.Label();
            this.FWVERLabel = new System.Windows.Forms.Label();
            this.FWVERButton = new System.Windows.Forms.Button();
            this.EvokeButton = new System.Windows.Forms.Button();
            this.CalStartButton = new System.Windows.Forms.Button();
            this.CalStopButton = new System.Windows.Forms.Button();
            this.DirectionLabel = new System.Windows.Forms.Label();
            this.ImpedanceLabel = new System.Windows.Forms.Label();
            this.PPGLabel = new System.Windows.Forms.Label();
            this.DCButton = new System.Windows.Forms.Button();
            this.ACbutton = new System.Windows.Forms.Button();
            ((System.ComponentModel.ISupportInitialize)(this.pictureBox1)).BeginInit();
            this.SuspendLayout();
            // 
            // listViewDevices
            // 
            this.listViewDevices.Anchor = ((System.Windows.Forms.AnchorStyles)((((System.Windows.Forms.AnchorStyles.Top | System.Windows.Forms.AnchorStyles.Bottom) 
            | System.Windows.Forms.AnchorStyles.Left) 
            | System.Windows.Forms.AnchorStyles.Right)));
            this.listViewDevices.Columns.AddRange(new System.Windows.Forms.ColumnHeader[] {
            this.columnHeaderName,
            this.columnHeaderID,
            this.columnHeaderPairable,
            this.columnHeaderConnected,
            this.columnHeaderAddress});
            this.listViewDevices.FullRowSelect = true;
            this.listViewDevices.HideSelection = false;
            this.listViewDevices.Location = new System.Drawing.Point(36, 62);
            this.listViewDevices.Margin = new System.Windows.Forms.Padding(4);
            this.listViewDevices.MultiSelect = false;
            this.listViewDevices.Name = "listViewDevices";
            this.listViewDevices.Size = new System.Drawing.Size(1217, 135);
            this.listViewDevices.TabIndex = 0;
            this.listViewDevices.UseCompatibleStateImageBehavior = false;
            this.listViewDevices.View = System.Windows.Forms.View.Details;
            // 
            // columnHeaderName
            // 
            this.columnHeaderName.Text = "Name";
            this.columnHeaderName.Width = 225;
            // 
            // columnHeaderID
            // 
            this.columnHeaderID.Text = "ID";
            this.columnHeaderID.Width = 215;
            // 
            // columnHeaderPairable
            // 
            this.columnHeaderPairable.Text = "Can Pair";
            this.columnHeaderPairable.Width = 81;
            // 
            // columnHeaderConnected
            // 
            this.columnHeaderConnected.Text = "Connected";
            this.columnHeaderConnected.Width = 96;
            // 
            // columnHeaderAddress
            // 
            this.columnHeaderAddress.Text = "Address";
            this.columnHeaderAddress.Width = 252;
            // 
            // ScannedDevicesLabel
            // 
            this.ScannedDevicesLabel.AutoSize = true;
            this.ScannedDevicesLabel.Location = new System.Drawing.Point(32, 22);
            this.ScannedDevicesLabel.Margin = new System.Windows.Forms.Padding(4, 0, 4, 0);
            this.ScannedDevicesLabel.Name = "ScannedDevicesLabel";
            this.ScannedDevicesLabel.Size = new System.Drawing.Size(117, 16);
            this.ScannedDevicesLabel.TabIndex = 1;
            this.ScannedDevicesLabel.Text = "Scanned Devices:";
            // 
            // buttonConnectDevice
            // 
            this.buttonConnectDevice.Location = new System.Drawing.Point(576, 545);
            this.buttonConnectDevice.Margin = new System.Windows.Forms.Padding(4);
            this.buttonConnectDevice.Name = "buttonConnectDevice";
            this.buttonConnectDevice.Size = new System.Drawing.Size(152, 28);
            this.buttonConnectDevice.TabIndex = 3;
            this.buttonConnectDevice.Text = "Connect";
            this.buttonConnectDevice.UseVisualStyleBackColor = true;
            this.buttonConnectDevice.Click += new System.EventHandler(this.button_ConnectDevice);
            // 
            // buttonDisconnectDevice
            // 
            this.buttonDisconnectDevice.Enabled = false;
            this.buttonDisconnectDevice.Location = new System.Drawing.Point(764, 545);
            this.buttonDisconnectDevice.Margin = new System.Windows.Forms.Padding(4);
            this.buttonDisconnectDevice.Name = "buttonDisconnectDevice";
            this.buttonDisconnectDevice.Size = new System.Drawing.Size(152, 28);
            this.buttonDisconnectDevice.TabIndex = 3;
            this.buttonDisconnectDevice.Text = "Disconnect";
            this.buttonDisconnectDevice.UseVisualStyleBackColor = true;
            this.buttonDisconnectDevice.Click += new System.EventHandler(this.button_DisconnectDevice);
            // 
            // buttonStartScan
            // 
            this.buttonStartScan.Location = new System.Drawing.Point(29, 545);
            this.buttonStartScan.Margin = new System.Windows.Forms.Padding(4);
            this.buttonStartScan.Name = "buttonStartScan";
            this.buttonStartScan.Size = new System.Drawing.Size(152, 28);
            this.buttonStartScan.TabIndex = 5;
            this.buttonStartScan.Text = "Start Scan";
            this.buttonStartScan.UseVisualStyleBackColor = true;
            this.buttonStartScan.Click += new System.EventHandler(this.button_startScanButton);
            // 
            // buttonStopScan
            // 
            this.buttonStopScan.DialogResult = System.Windows.Forms.DialogResult.Cancel;
            this.buttonStopScan.Enabled = false;
            this.buttonStopScan.Location = new System.Drawing.Point(218, 545);
            this.buttonStopScan.Margin = new System.Windows.Forms.Padding(4);
            this.buttonStopScan.Name = "buttonStopScan";
            this.buttonStopScan.Size = new System.Drawing.Size(152, 28);
            this.buttonStopScan.TabIndex = 6;
            this.buttonStopScan.Text = "Stop Scan";
            this.buttonStopScan.UseVisualStyleBackColor = true;
            this.buttonStopScan.Click += new System.EventHandler(this.button_stopScanButton);
            // 
            // ConnectedDeviceLabel
            // 
            this.ConnectedDeviceLabel.AutoSize = true;
            this.ConnectedDeviceLabel.Location = new System.Drawing.Point(32, 210);
            this.ConnectedDeviceLabel.Margin = new System.Windows.Forms.Padding(4, 0, 4, 0);
            this.ConnectedDeviceLabel.Name = "ConnectedDeviceLabel";
            this.ConnectedDeviceLabel.Size = new System.Drawing.Size(121, 16);
            this.ConnectedDeviceLabel.TabIndex = 7;
            this.ConnectedDeviceLabel.Text = "Connected Device:";
            // 
            // DeviceLabel
            // 
            this.DeviceLabel.AutoSize = true;
            this.DeviceLabel.Location = new System.Drawing.Point(168, 210);
            this.DeviceLabel.Margin = new System.Windows.Forms.Padding(4, 0, 4, 0);
            this.DeviceLabel.Name = "DeviceLabel";
            this.DeviceLabel.Size = new System.Drawing.Size(40, 16);
            this.DeviceLabel.TabIndex = 8;
            this.DeviceLabel.Text = "None";
            // 
            // accXLabel
            // 
            this.accXLabel.AutoSize = true;
            this.accXLabel.Location = new System.Drawing.Point(380, 249);
            this.accXLabel.Margin = new System.Windows.Forms.Padding(4, 0, 4, 0);
            this.accXLabel.Name = "accXLabel";
            this.accXLabel.Size = new System.Drawing.Size(109, 16);
            this.accXLabel.TabIndex = 9;
            this.accXLabel.Text = "Accelerometer X:";
            // 
            // accYLabel
            // 
            this.accYLabel.AutoSize = true;
            this.accYLabel.Location = new System.Drawing.Point(380, 278);
            this.accYLabel.Margin = new System.Windows.Forms.Padding(4, 0, 4, 0);
            this.accYLabel.Name = "accYLabel";
            this.accYLabel.Size = new System.Drawing.Size(110, 16);
            this.accYLabel.TabIndex = 10;
            this.accYLabel.Text = "Accelerometer Y:";
            // 
            // accZLabel
            // 
            this.accZLabel.AutoSize = true;
            this.accZLabel.Location = new System.Drawing.Point(380, 308);
            this.accZLabel.Margin = new System.Windows.Forms.Padding(4, 0, 4, 0);
            this.accZLabel.Name = "accZLabel";
            this.accZLabel.Size = new System.Drawing.Size(109, 16);
            this.accZLabel.TabIndex = 11;
            this.accZLabel.Text = "Accelerometer Z:";
            // 
            // channel1Label
            // 
            this.channel1Label.AutoSize = true;
            this.channel1Label.Location = new System.Drawing.Point(214, 249);
            this.channel1Label.Margin = new System.Windows.Forms.Padding(4, 0, 4, 0);
            this.channel1Label.Name = "channel1Label";
            this.channel1Label.Size = new System.Drawing.Size(69, 16);
            this.channel1Label.TabIndex = 12;
            this.channel1Label.Text = "Channel 1:";
            // 
            // channel2Label
            // 
            this.channel2Label.AutoSize = true;
            this.channel2Label.Location = new System.Drawing.Point(214, 278);
            this.channel2Label.Margin = new System.Windows.Forms.Padding(4, 0, 4, 0);
            this.channel2Label.Name = "channel2Label";
            this.channel2Label.Size = new System.Drawing.Size(69, 16);
            this.channel2Label.TabIndex = 13;
            this.channel2Label.Text = "Channel 2:";
            // 
            // channel3Label
            // 
            this.channel3Label.AutoSize = true;
            this.channel3Label.Location = new System.Drawing.Point(214, 308);
            this.channel3Label.Margin = new System.Windows.Forms.Padding(4, 0, 4, 0);
            this.channel3Label.Name = "channel3Label";
            this.channel3Label.Size = new System.Drawing.Size(69, 16);
            this.channel3Label.TabIndex = 14;
            this.channel3Label.Text = "Channel 3:";
            // 
            // channel4Label
            // 
            this.channel4Label.AutoSize = true;
            this.channel4Label.Location = new System.Drawing.Point(214, 338);
            this.channel4Label.Margin = new System.Windows.Forms.Padding(4, 0, 4, 0);
            this.channel4Label.Name = "channel4Label";
            this.channel4Label.Size = new System.Drawing.Size(69, 16);
            this.channel4Label.TabIndex = 15;
            this.channel4Label.Text = "Channel 4:";
            // 
            // attentionLabel
            // 
            this.attentionLabel.AutoSize = true;
            this.attentionLabel.Location = new System.Drawing.Point(578, 249);
            this.attentionLabel.Margin = new System.Windows.Forms.Padding(4, 0, 4, 0);
            this.attentionLabel.Name = "attentionLabel";
            this.attentionLabel.Size = new System.Drawing.Size(61, 16);
            this.attentionLabel.TabIndex = 16;
            this.attentionLabel.Text = "Attention:";
            // 
            // relaxationLabel
            // 
            this.relaxationLabel.AutoSize = true;
            this.relaxationLabel.Location = new System.Drawing.Point(578, 278);
            this.relaxationLabel.Margin = new System.Windows.Forms.Padding(4, 0, 4, 0);
            this.relaxationLabel.Name = "relaxationLabel";
            this.relaxationLabel.Size = new System.Drawing.Size(74, 16);
            this.relaxationLabel.TabIndex = 17;
            this.relaxationLabel.Text = "Relaxation:";
            // 
            // batteryLabel
            // 
            this.batteryLabel.AutoSize = true;
            this.batteryLabel.Location = new System.Drawing.Point(32, 248);
            this.batteryLabel.Margin = new System.Windows.Forms.Padding(4, 0, 4, 0);
            this.batteryLabel.Name = "batteryLabel";
            this.batteryLabel.Size = new System.Drawing.Size(52, 16);
            this.batteryLabel.TabIndex = 18;
            this.batteryLabel.Text = "Battery:";
            // 
            // MCUIDLabel
            // 
            this.MCUIDLabel.Location = new System.Drawing.Point(32, 228);
            this.MCUIDLabel.Margin = new System.Windows.Forms.Padding(4, 0, 4, 0);
            this.MCUIDLabel.Name = "MCUIDLabel";
            this.MCUIDLabel.Size = new System.Drawing.Size(176, 20);
            this.MCUIDLabel.TabIndex = 20;
            this.MCUIDLabel.Text = "MCU ID/MAC:";
            // 
            // SignalReadyLabel
            // 
            this.SignalReadyLabel.AutoSize = true;
            this.SignalReadyLabel.Location = new System.Drawing.Point(32, 308);
            this.SignalReadyLabel.Margin = new System.Windows.Forms.Padding(4, 0, 4, 0);
            this.SignalReadyLabel.Name = "SignalReadyLabel";
            this.SignalReadyLabel.Size = new System.Drawing.Size(92, 16);
            this.SignalReadyLabel.TabIndex = 27;
            this.SignalReadyLabel.Text = "Signal Ready:";
            // 
            // ConnectionCheckLabel
            // 
            this.ConnectionCheckLabel.AutoSize = true;
            this.ConnectionCheckLabel.Location = new System.Drawing.Point(32, 278);
            this.ConnectionCheckLabel.Margin = new System.Windows.Forms.Padding(4, 0, 4, 0);
            this.ConnectionCheckLabel.Name = "ConnectionCheckLabel";
            this.ConnectionCheckLabel.Size = new System.Drawing.Size(115, 16);
            this.ConnectionCheckLabel.TabIndex = 28;
            this.ConnectionCheckLabel.Text = "Connection Check";
            // 
            // AuthenticationStatus
            // 
            this.AuthenticationStatus.AutoSize = true;
            this.AuthenticationStatus.Location = new System.Drawing.Point(32, 338);
            this.AuthenticationStatus.Margin = new System.Windows.Forms.Padding(4, 0, 4, 0);
            this.AuthenticationStatus.Name = "AuthenticationStatus";
            this.AuthenticationStatus.Size = new System.Drawing.Size(93, 16);
            this.AuthenticationStatus.TabIndex = 29;
            this.AuthenticationStatus.Text = "Authentication:";
            // 
            // pictureBox1
            // 
            this.pictureBox1.Location = new System.Drawing.Point(29, 391);
            this.pictureBox1.Margin = new System.Windows.Forms.Padding(2);
            this.pictureBox1.Name = "pictureBox1";
            this.pictureBox1.Size = new System.Drawing.Size(888, 148);
            this.pictureBox1.TabIndex = 30;
            this.pictureBox1.TabStop = false;
            this.pictureBox1.Paint += new System.Windows.Forms.PaintEventHandler(this.pictureBox1_Paint);
            // 
            // workloadLabel
            // 
            this.workloadLabel.AutoSize = true;
            this.workloadLabel.Location = new System.Drawing.Point(578, 308);
            this.workloadLabel.Margin = new System.Windows.Forms.Padding(2, 0, 2, 0);
            this.workloadLabel.Name = "workloadLabel";
            this.workloadLabel.Size = new System.Drawing.Size(69, 16);
            this.workloadLabel.TabIndex = 31;
            this.workloadLabel.Text = "Workload:";
            // 
            // alphaLabel
            // 
            this.alphaLabel.AutoSize = true;
            this.alphaLabel.Location = new System.Drawing.Point(742, 281);
            this.alphaLabel.Margin = new System.Windows.Forms.Padding(2, 0, 2, 0);
            this.alphaLabel.Name = "alphaLabel";
            this.alphaLabel.Size = new System.Drawing.Size(42, 16);
            this.alphaLabel.TabIndex = 32;
            this.alphaLabel.Text = "Alpha";
            this.alphaLabel.TextAlign = System.Drawing.ContentAlignment.TopCenter;
            // 
            // betaLabel
            // 
            this.betaLabel.AutoSize = true;
            this.betaLabel.Location = new System.Drawing.Point(742, 298);
            this.betaLabel.Margin = new System.Windows.Forms.Padding(2, 0, 2, 0);
            this.betaLabel.Name = "betaLabel";
            this.betaLabel.Size = new System.Drawing.Size(35, 16);
            this.betaLabel.TabIndex = 33;
            this.betaLabel.Text = "Beta";
            this.betaLabel.TextAlign = System.Drawing.ContentAlignment.TopCenter;
            // 
            // thetaLabel
            // 
            this.thetaLabel.AutoSize = true;
            this.thetaLabel.Location = new System.Drawing.Point(742, 264);
            this.thetaLabel.Margin = new System.Windows.Forms.Padding(2, 0, 2, 0);
            this.thetaLabel.Name = "thetaLabel";
            this.thetaLabel.Size = new System.Drawing.Size(42, 16);
            this.thetaLabel.TabIndex = 34;
            this.thetaLabel.Text = "Theta";
            this.thetaLabel.TextAlign = System.Drawing.ContentAlignment.TopCenter;
            // 
            // gammaLabel
            // 
            this.gammaLabel.AutoSize = true;
            this.gammaLabel.Location = new System.Drawing.Point(742, 315);
            this.gammaLabel.Margin = new System.Windows.Forms.Padding(2, 0, 2, 0);
            this.gammaLabel.Name = "gammaLabel";
            this.gammaLabel.Size = new System.Drawing.Size(55, 16);
            this.gammaLabel.TabIndex = 35;
            this.gammaLabel.Text = "Gamma";
            this.gammaLabel.TextAlign = System.Drawing.ContentAlignment.TopCenter;
            // 
            // ARWCheckbox
            // 
            this.ARWCheckbox.AutoSize = true;
            this.ARWCheckbox.Location = new System.Drawing.Point(600, 225);
            this.ARWCheckbox.Margin = new System.Windows.Forms.Padding(2);
            this.ARWCheckbox.Name = "ARWCheckbox";
            this.ARWCheckbox.Size = new System.Drawing.Size(18, 17);
            this.ARWCheckbox.TabIndex = 36;
            this.ARWCheckbox.UseVisualStyleBackColor = true;
            this.ARWCheckbox.CheckedChanged += new System.EventHandler(this.ARW_CheckedChanged);
            // 
            // ABDTCheckbox
            // 
            this.ABDTCheckbox.AutoSize = true;
            this.ABDTCheckbox.Location = new System.Drawing.Point(755, 225);
            this.ABDTCheckbox.Margin = new System.Windows.Forms.Padding(2);
            this.ABDTCheckbox.Name = "ABDTCheckbox";
            this.ABDTCheckbox.Size = new System.Drawing.Size(18, 17);
            this.ABDTCheckbox.TabIndex = 37;
            this.ABDTCheckbox.UseVisualStyleBackColor = true;
            this.ABDTCheckbox.CheckedChanged += new System.EventHandler(this.ABDT_CheckedChanged);
            // 
            // EEG_Check
            // 
            this.EEG_Check.AutoSize = true;
            this.EEG_Check.Location = new System.Drawing.Point(862, 225);
            this.EEG_Check.Margin = new System.Windows.Forms.Padding(2);
            this.EEG_Check.Name = "EEG_Check";
            this.EEG_Check.Size = new System.Drawing.Size(57, 20);
            this.EEG_Check.TabIndex = 38;
            this.EEG_Check.Text = "EEG";
            this.EEG_Check.UseVisualStyleBackColor = true;
            this.EEG_Check.CheckedChanged += new System.EventHandler(this.EEG_CheckedChanged);
            // 
            // deltaLabel
            // 
            this.deltaLabel.AutoSize = true;
            this.deltaLabel.Location = new System.Drawing.Point(742, 248);
            this.deltaLabel.Margin = new System.Windows.Forms.Padding(2, 0, 2, 0);
            this.deltaLabel.Name = "deltaLabel";
            this.deltaLabel.Size = new System.Drawing.Size(39, 16);
            this.deltaLabel.TabIndex = 39;
            this.deltaLabel.Text = "Delta";
            this.deltaLabel.TextAlign = System.Drawing.ContentAlignment.TopCenter;
            // 
            // MCUIDValue
            // 
            this.MCUIDValue.AutoSize = true;
            this.MCUIDValue.Location = new System.Drawing.Point(168, 226);
            this.MCUIDValue.Margin = new System.Windows.Forms.Padding(2, 0, 2, 0);
            this.MCUIDValue.Name = "MCUIDValue";
            this.MCUIDValue.Size = new System.Drawing.Size(0, 16);
            this.MCUIDValue.TabIndex = 40;
            // 
            // DevelopmentCodeBox
            // 
            this.DevelopmentCodeBox.Location = new System.Drawing.Point(152, 362);
            this.DevelopmentCodeBox.Margin = new System.Windows.Forms.Padding(2);
            this.DevelopmentCodeBox.Name = "DevelopmentCodeBox";
            this.DevelopmentCodeBox.Size = new System.Drawing.Size(242, 22);
            this.DevelopmentCodeBox.TabIndex = 41;
            this.DevelopmentCodeBox.UseSystemPasswordChar = true;
            this.DevelopmentCodeBox.KeyPress += new System.Windows.Forms.KeyPressEventHandler(this.CheckEnterKeyPress);
            // 
            // label1
            // 
            this.label1.AutoSize = true;
            this.label1.Location = new System.Drawing.Point(32, 366);
            this.label1.Margin = new System.Windows.Forms.Padding(2, 0, 2, 0);
            this.label1.Name = "label1";
            this.label1.Size = new System.Drawing.Size(110, 16);
            this.label1.TabIndex = 42;
            this.label1.Text = "Developer Code:";
            // 
            // BTEnabledLabel
            // 
            this.BTEnabledLabel.AutoSize = true;
            this.BTEnabledLabel.Location = new System.Drawing.Point(401, 366);
            this.BTEnabledLabel.Margin = new System.Windows.Forms.Padding(4, 0, 4, 0);
            this.BTEnabledLabel.Name = "BTEnabledLabel";
            this.BTEnabledLabel.Size = new System.Drawing.Size(82, 16);
            this.BTEnabledLabel.TabIndex = 43;
            this.BTEnabledLabel.Text = "BT Enabled:";
            // 
            // isBTEnabled
            // 
            this.isBTEnabled.AutoSize = true;
            this.isBTEnabled.Location = new System.Drawing.Point(491, 366);
            this.isBTEnabled.Margin = new System.Windows.Forms.Padding(4, 0, 4, 0);
            this.isBTEnabled.Name = "isBTEnabled";
            this.isBTEnabled.Size = new System.Drawing.Size(0, 16);
            this.isBTEnabled.TabIndex = 44;
            // 
            // label2
            // 
            this.label2.AutoSize = true;
            this.label2.Location = new System.Drawing.Point(551, 366);
            this.label2.Margin = new System.Windows.Forms.Padding(4, 0, 4, 0);
            this.label2.Name = "label2";
            this.label2.Size = new System.Drawing.Size(65, 16);
            this.label2.TabIndex = 45;
            this.label2.Text = "OSC Port:";
            // 
            // OSCPortInput
            // 
            this.OSCPortInput.Location = new System.Drawing.Point(614, 361);
            this.OSCPortInput.Margin = new System.Windows.Forms.Padding(4);
            this.OSCPortInput.Name = "OSCPortInput";
            this.OSCPortInput.Size = new System.Drawing.Size(124, 22);
            this.OSCPortInput.TabIndex = 46;
            this.OSCPortInput.Text = "4545";
            this.OSCPortInput.TextChanged += new System.EventHandler(this.OSCPortInput_TextChanged);
            // 
            // authButton
            // 
            this.authButton.DialogResult = System.Windows.Forms.DialogResult.Cancel;
            this.authButton.Location = new System.Drawing.Point(389, 545);
            this.authButton.Margin = new System.Windows.Forms.Padding(4);
            this.authButton.Name = "authButton";
            this.authButton.Size = new System.Drawing.Size(152, 28);
            this.authButton.TabIndex = 47;
            this.authButton.Text = "Authenticate";
            this.authButton.UseVisualStyleBackColor = true;
            this.authButton.Click += new System.EventHandler(this.authButton_Click);
            // 
            // RedButton
            // 
            this.RedButton.Location = new System.Drawing.Point(937, 464);
            this.RedButton.Margin = new System.Windows.Forms.Padding(4);
            this.RedButton.Name = "RedButton";
            this.RedButton.Size = new System.Drawing.Size(61, 28);
            this.RedButton.TabIndex = 48;
            this.RedButton.Text = "RED";
            this.RedButton.UseVisualStyleBackColor = true;
            this.RedButton.Click += new System.EventHandler(this.RedButton_Click);
            // 
            // GreenButton
            // 
            this.GreenButton.Location = new System.Drawing.Point(1006, 464);
            this.GreenButton.Margin = new System.Windows.Forms.Padding(4);
            this.GreenButton.Name = "GreenButton";
            this.GreenButton.Size = new System.Drawing.Size(94, 28);
            this.GreenButton.TabIndex = 49;
            this.GreenButton.Text = "GREEN";
            this.GreenButton.UseVisualStyleBackColor = true;
            this.GreenButton.Click += new System.EventHandler(this.GreenButton_Click);
            // 
            // BlueButton
            // 
            this.BlueButton.Location = new System.Drawing.Point(1108, 464);
            this.BlueButton.Margin = new System.Windows.Forms.Padding(4);
            this.BlueButton.Name = "BlueButton";
            this.BlueButton.Size = new System.Drawing.Size(81, 28);
            this.BlueButton.TabIndex = 50;
            this.BlueButton.Text = "BLUE";
            this.BlueButton.UseVisualStyleBackColor = true;
            this.BlueButton.Click += new System.EventHandler(this.BlueButton_Click);
            // 
            // CyanButton
            // 
            this.CyanButton.Location = new System.Drawing.Point(937, 503);
            this.CyanButton.Margin = new System.Windows.Forms.Padding(4);
            this.CyanButton.Name = "CyanButton";
            this.CyanButton.Size = new System.Drawing.Size(61, 28);
            this.CyanButton.TabIndex = 51;
            this.CyanButton.Text = "CYAN";
            this.CyanButton.UseVisualStyleBackColor = true;
            this.CyanButton.Click += new System.EventHandler(this.CyanButton_Click);
            // 
            // MagentaButton
            // 
            this.MagentaButton.Location = new System.Drawing.Point(1006, 503);
            this.MagentaButton.Margin = new System.Windows.Forms.Padding(4);
            this.MagentaButton.Name = "MagentaButton";
            this.MagentaButton.Size = new System.Drawing.Size(94, 28);
            this.MagentaButton.TabIndex = 52;
            this.MagentaButton.Text = "MAGENTA";
            this.MagentaButton.UseVisualStyleBackColor = true;
            this.MagentaButton.Click += new System.EventHandler(this.MagentaButton_Click);
            // 
            // YellowButton
            // 
            this.YellowButton.Location = new System.Drawing.Point(1108, 503);
            this.YellowButton.Margin = new System.Windows.Forms.Padding(4);
            this.YellowButton.Name = "YellowButton";
            this.YellowButton.Size = new System.Drawing.Size(81, 28);
            this.YellowButton.TabIndex = 53;
            this.YellowButton.Text = "YELLOW";
            this.YellowButton.UseVisualStyleBackColor = true;
            this.YellowButton.Click += new System.EventHandler(this.YellowButton_Click);
            // 
            // StopRGBButton
            // 
            this.StopRGBButton.Location = new System.Drawing.Point(937, 544);
            this.StopRGBButton.Margin = new System.Windows.Forms.Padding(4);
            this.StopRGBButton.Name = "StopRGBButton";
            this.StopRGBButton.Size = new System.Drawing.Size(252, 28);
            this.StopRGBButton.TabIndex = 54;
            this.StopRGBButton.Text = "Disable Indicator";
            this.StopRGBButton.UseVisualStyleBackColor = true;
            this.StopRGBButton.Click += new System.EventHandler(this.stopRGBButton_Click);
            // 
            // StartButton
            // 
            this.StartButton.Location = new System.Drawing.Point(937, 204);
            this.StartButton.Margin = new System.Windows.Forms.Padding(4);
            this.StartButton.Name = "StartButton";
            this.StartButton.Size = new System.Drawing.Size(61, 28);
            this.StartButton.TabIndex = 55;
            this.StartButton.Text = "Start";
            this.StartButton.UseVisualStyleBackColor = true;
            this.StartButton.Click += new System.EventHandler(this.StartButton_Click);
            // 
            // StopButton
            // 
            this.StopButton.Location = new System.Drawing.Point(1006, 204);
            this.StopButton.Margin = new System.Windows.Forms.Padding(4);
            this.StopButton.Name = "StopButton";
            this.StopButton.Size = new System.Drawing.Size(61, 28);
            this.StopButton.TabIndex = 56;
            this.StopButton.Text = "Stop";
            this.StopButton.UseVisualStyleBackColor = true;
            this.StopButton.Click += new System.EventHandler(this.StopButton_Click);
            // 
            // PPGStartButton
            // 
            this.PPGStartButton.Location = new System.Drawing.Point(1085, 204);
            this.PPGStartButton.Margin = new System.Windows.Forms.Padding(4);
            this.PPGStartButton.Name = "PPGStartButton";
            this.PPGStartButton.Size = new System.Drawing.Size(80, 28);
            this.PPGStartButton.TabIndex = 57;
            this.PPGStartButton.Text = "PPG Start";
            this.PPGStartButton.UseVisualStyleBackColor = true;
            this.PPGStartButton.Click += new System.EventHandler(this.PPGStartButton_Click);
            // 
            // PPGStopButton
            // 
            this.PPGStopButton.Location = new System.Drawing.Point(1173, 204);
            this.PPGStopButton.Margin = new System.Windows.Forms.Padding(4);
            this.PPGStopButton.Name = "PPGStopButton";
            this.PPGStopButton.Size = new System.Drawing.Size(80, 28);
            this.PPGStopButton.TabIndex = 58;
            this.PPGStopButton.Text = "PPG Stop";
            this.PPGStopButton.UseVisualStyleBackColor = true;
            this.PPGStopButton.Click += new System.EventHandler(this.PPGStopButton_Click);
            // 
            // SPO2Label
            // 
            this.SPO2Label.AutoSize = true;
            this.SPO2Label.Location = new System.Drawing.Point(934, 248);
            this.SPO2Label.Margin = new System.Windows.Forms.Padding(4, 0, 4, 0);
            this.SPO2Label.Name = "SPO2Label";
            this.SPO2Label.Size = new System.Drawing.Size(45, 16);
            this.SPO2Label.TabIndex = 59;
            this.SPO2Label.Text = "SPO2:";
            this.SPO2Label.Click += new System.EventHandler(this.label3_Click);
            // 
            // HeartRateLabel
            // 
            this.HeartRateLabel.AutoSize = true;
            this.HeartRateLabel.Location = new System.Drawing.Point(1082, 248);
            this.HeartRateLabel.Margin = new System.Windows.Forms.Padding(4, 0, 4, 0);
            this.HeartRateLabel.Name = "HeartRateLabel";
            this.HeartRateLabel.Size = new System.Drawing.Size(75, 16);
            this.HeartRateLabel.TabIndex = 60;
            this.HeartRateLabel.Text = "Heart Rate:";
            // 
            // EvokeLabel
            // 
            this.EvokeLabel.AutoSize = true;
            this.EvokeLabel.Location = new System.Drawing.Point(1015, 304);
            this.EvokeLabel.Margin = new System.Windows.Forms.Padding(4, 0, 4, 0);
            this.EvokeLabel.Name = "EvokeLabel";
            this.EvokeLabel.Size = new System.Drawing.Size(49, 16);
            this.EvokeLabel.TabIndex = 61;
            this.EvokeLabel.Text = "Evoke:";
            // 
            // XGainLabel
            // 
            this.XGainLabel.AutoSize = true;
            this.XGainLabel.Location = new System.Drawing.Point(934, 405);
            this.XGainLabel.Margin = new System.Windows.Forms.Padding(4, 0, 4, 0);
            this.XGainLabel.Name = "XGainLabel";
            this.XGainLabel.Size = new System.Drawing.Size(46, 16);
            this.XGainLabel.TabIndex = 62;
            this.XGainLabel.Text = "XGain:";
            // 
            // YGainLabel
            // 
            this.YGainLabel.AutoSize = true;
            this.YGainLabel.Location = new System.Drawing.Point(1049, 405);
            this.YGainLabel.Margin = new System.Windows.Forms.Padding(4, 0, 4, 0);
            this.YGainLabel.Name = "YGainLabel";
            this.YGainLabel.Size = new System.Drawing.Size(47, 16);
            this.YGainLabel.TabIndex = 63;
            this.YGainLabel.Text = "YGain:";
            // 
            // ZGainLabel
            // 
            this.ZGainLabel.AutoSize = true;
            this.ZGainLabel.Location = new System.Drawing.Point(1170, 405);
            this.ZGainLabel.Margin = new System.Windows.Forms.Padding(4, 0, 4, 0);
            this.ZGainLabel.Name = "ZGainLabel";
            this.ZGainLabel.Size = new System.Drawing.Size(46, 16);
            this.ZGainLabel.TabIndex = 64;
            this.ZGainLabel.Text = "ZGain:";
            // 
            // FWVERLabel
            // 
            this.FWVERLabel.AutoSize = true;
            this.FWVERLabel.Location = new System.Drawing.Point(1049, 434);
            this.FWVERLabel.Margin = new System.Windows.Forms.Padding(4, 0, 4, 0);
            this.FWVERLabel.Name = "FWVERLabel";
            this.FWVERLabel.Size = new System.Drawing.Size(59, 16);
            this.FWVERLabel.TabIndex = 65;
            this.FWVERLabel.Text = "FWVER:";
            // 
            // FWVERButton
            // 
            this.FWVERButton.Location = new System.Drawing.Point(937, 428);
            this.FWVERButton.Margin = new System.Windows.Forms.Padding(4);
            this.FWVERButton.Name = "FWVERButton";
            this.FWVERButton.Size = new System.Drawing.Size(70, 28);
            this.FWVERButton.TabIndex = 66;
            this.FWVERButton.Text = "FWVER";
            this.FWVERButton.UseVisualStyleBackColor = true;
            this.FWVERButton.Click += new System.EventHandler(this.FWVERButton_Click);
            // 
            // EvokeButton
            // 
            this.EvokeButton.Location = new System.Drawing.Point(937, 298);
            this.EvokeButton.Margin = new System.Windows.Forms.Padding(4);
            this.EvokeButton.Name = "EvokeButton";
            this.EvokeButton.Size = new System.Drawing.Size(70, 28);
            this.EvokeButton.TabIndex = 67;
            this.EvokeButton.Text = "Evoke";
            this.EvokeButton.UseVisualStyleBackColor = true;
            this.EvokeButton.Click += new System.EventHandler(this.EvokeButton_Click);
            // 
            // CalStartButton
            // 
            this.CalStartButton.Location = new System.Drawing.Point(937, 373);
            this.CalStartButton.Margin = new System.Windows.Forms.Padding(4);
            this.CalStartButton.Name = "CalStartButton";
            this.CalStartButton.Size = new System.Drawing.Size(70, 28);
            this.CalStartButton.TabIndex = 68;
            this.CalStartButton.Text = "Cal Start";
            this.CalStartButton.UseVisualStyleBackColor = true;
            this.CalStartButton.Click += new System.EventHandler(this.CalStartButton_Click);
            // 
            // CalStopButton
            // 
            this.CalStopButton.Location = new System.Drawing.Point(1015, 373);
            this.CalStopButton.Margin = new System.Windows.Forms.Padding(4);
            this.CalStopButton.Name = "CalStopButton";
            this.CalStopButton.Size = new System.Drawing.Size(70, 28);
            this.CalStopButton.TabIndex = 69;
            this.CalStopButton.Text = "Cal Stop";
            this.CalStopButton.UseVisualStyleBackColor = true;
            this.CalStopButton.Click += new System.EventHandler(this.CalStopButton_Click);
            // 
            // DirectionLabel
            // 
            this.DirectionLabel.AutoSize = true;
            this.DirectionLabel.Location = new System.Drawing.Point(934, 353);
            this.DirectionLabel.Margin = new System.Windows.Forms.Padding(4, 0, 4, 0);
            this.DirectionLabel.Name = "DirectionLabel";
            this.DirectionLabel.Size = new System.Drawing.Size(63, 16);
            this.DirectionLabel.TabIndex = 70;
            this.DirectionLabel.Text = "Direction:";
            // 
            // ImpedanceLabel
            // 
            this.ImpedanceLabel.AutoSize = true;
            this.ImpedanceLabel.Location = new System.Drawing.Point(934, 326);
            this.ImpedanceLabel.Margin = new System.Windows.Forms.Padding(4, 0, 4, 0);
            this.ImpedanceLabel.Name = "ImpedanceLabel";
            this.ImpedanceLabel.Size = new System.Drawing.Size(78, 16);
            this.ImpedanceLabel.TabIndex = 71;
            this.ImpedanceLabel.Text = "Impedance:";
            // 
            // PPGLabel
            // 
            this.PPGLabel.AutoSize = true;
            this.PPGLabel.Location = new System.Drawing.Point(934, 278);
            this.PPGLabel.Margin = new System.Windows.Forms.Padding(4, 0, 4, 0);
            this.PPGLabel.Name = "PPGLabel";
            this.PPGLabel.Size = new System.Drawing.Size(38, 16);
            this.PPGLabel.TabIndex = 72;
            this.PPGLabel.Text = "PPG:";
            // 
            // DCButton
            // 
            this.DCButton.Location = new System.Drawing.Point(1100, 373);
            this.DCButton.Margin = new System.Windows.Forms.Padding(4);
            this.DCButton.Name = "DCButton";
            this.DCButton.Size = new System.Drawing.Size(70, 28);
            this.DCButton.TabIndex = 73;
            this.DCButton.Text = "DC";
            this.DCButton.UseVisualStyleBackColor = true;
            this.DCButton.Click += new System.EventHandler(this.DCButton_Click);
            // 
            // ACbutton
            // 
            this.ACbutton.Location = new System.Drawing.Point(1173, 373);
            this.ACbutton.Margin = new System.Windows.Forms.Padding(4);
            this.ACbutton.Name = "ACbutton";
            this.ACbutton.Size = new System.Drawing.Size(70, 28);
            this.ACbutton.TabIndex = 74;
            this.ACbutton.Text = "AC";
            this.ACbutton.UseVisualStyleBackColor = true;
            this.ACbutton.Click += new System.EventHandler(this.ACbutton_Click);
            // 
            // NSB_SDK
            // 
            this.AutoScaleDimensions = new System.Drawing.SizeF(120F, 120F);
            this.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Dpi;
            this.ClientSize = new System.Drawing.Size(1286, 580);
            this.Controls.Add(this.ACbutton);
            this.Controls.Add(this.DCButton);
            this.Controls.Add(this.PPGLabel);
            this.Controls.Add(this.ImpedanceLabel);
            this.Controls.Add(this.DirectionLabel);
            this.Controls.Add(this.CalStopButton);
            this.Controls.Add(this.CalStartButton);
            this.Controls.Add(this.EvokeButton);
            this.Controls.Add(this.FWVERButton);
            this.Controls.Add(this.FWVERLabel);
            this.Controls.Add(this.ZGainLabel);
            this.Controls.Add(this.YGainLabel);
            this.Controls.Add(this.XGainLabel);
            this.Controls.Add(this.EvokeLabel);
            this.Controls.Add(this.HeartRateLabel);
            this.Controls.Add(this.SPO2Label);
            this.Controls.Add(this.PPGStopButton);
            this.Controls.Add(this.PPGStartButton);
            this.Controls.Add(this.StopButton);
            this.Controls.Add(this.StartButton);
            this.Controls.Add(this.StopRGBButton);
            this.Controls.Add(this.YellowButton);
            this.Controls.Add(this.MagentaButton);
            this.Controls.Add(this.CyanButton);
            this.Controls.Add(this.BlueButton);
            this.Controls.Add(this.GreenButton);
            this.Controls.Add(this.RedButton);
            this.Controls.Add(this.authButton);
            this.Controls.Add(this.OSCPortInput);
            this.Controls.Add(this.label2);
            this.Controls.Add(this.isBTEnabled);
            this.Controls.Add(this.BTEnabledLabel);
            this.Controls.Add(this.label1);
            this.Controls.Add(this.DevelopmentCodeBox);
            this.Controls.Add(this.MCUIDValue);
            this.Controls.Add(this.deltaLabel);
            this.Controls.Add(this.EEG_Check);
            this.Controls.Add(this.ABDTCheckbox);
            this.Controls.Add(this.ARWCheckbox);
            this.Controls.Add(this.gammaLabel);
            this.Controls.Add(this.thetaLabel);
            this.Controls.Add(this.betaLabel);
            this.Controls.Add(this.alphaLabel);
            this.Controls.Add(this.workloadLabel);
            this.Controls.Add(this.pictureBox1);
            this.Controls.Add(this.AuthenticationStatus);
            this.Controls.Add(this.ConnectionCheckLabel);
            this.Controls.Add(this.SignalReadyLabel);
            this.Controls.Add(this.MCUIDLabel);
            this.Controls.Add(this.batteryLabel);
            this.Controls.Add(this.relaxationLabel);
            this.Controls.Add(this.attentionLabel);
            this.Controls.Add(this.channel4Label);
            this.Controls.Add(this.channel3Label);
            this.Controls.Add(this.channel2Label);
            this.Controls.Add(this.channel1Label);
            this.Controls.Add(this.accZLabel);
            this.Controls.Add(this.accYLabel);
            this.Controls.Add(this.accXLabel);
            this.Controls.Add(this.DeviceLabel);
            this.Controls.Add(this.ConnectedDeviceLabel);
            this.Controls.Add(this.buttonStopScan);
            this.Controls.Add(this.buttonStartScan);
            this.Controls.Add(this.buttonDisconnectDevice);
            this.Controls.Add(this.buttonConnectDevice);
            this.Controls.Add(this.ScannedDevicesLabel);
            this.Controls.Add(this.listViewDevices);
            this.FormBorderStyle = System.Windows.Forms.FormBorderStyle.FixedSingle;
            this.Margin = new System.Windows.Forms.Padding(4);
            this.MaximizeBox = false;
            this.Name = "NSB_SDK";
            this.StartPosition = System.Windows.Forms.FormStartPosition.CenterParent;
            this.Text = "ServerBLE Standard";
            this.Load += new System.EventHandler(this.Form_Load);
            ((System.ComponentModel.ISupportInitialize)(this.pictureBox1)).EndInit();
            this.ResumeLayout(false);
            this.PerformLayout();

        }

        #endregion

        private System.Windows.Forms.ListView listViewDevices;
        private System.Windows.Forms.ColumnHeader columnHeaderName;
        private System.Windows.Forms.ColumnHeader columnHeaderID;
        private System.Windows.Forms.ColumnHeader columnHeaderPairable;
        private System.Windows.Forms.Label ScannedDevicesLabel;
        private System.Windows.Forms.ColumnHeader columnHeaderConnected;
        private System.Windows.Forms.ColumnHeader columnHeaderAddress;
        private System.Windows.Forms.Button buttonConnectDevice;
        private System.Windows.Forms.Button buttonDisconnectDevice;
        private System.Windows.Forms.Button buttonStartScan;
        private System.Windows.Forms.Button buttonStopScan;
        private System.Windows.Forms.Label ConnectedDeviceLabel;
        private System.Windows.Forms.Label DeviceLabel;
        private System.Windows.Forms.Label accXLabel;
        private System.Windows.Forms.Label accYLabel;
        private System.Windows.Forms.Label accZLabel;
        private System.Windows.Forms.Label channel1Label;
        private System.Windows.Forms.Label channel2Label;
        private System.Windows.Forms.Label channel3Label;
        private System.Windows.Forms.Label channel4Label;
        private System.Windows.Forms.Label attentionLabel;
        private System.Windows.Forms.Label relaxationLabel;
        private System.Windows.Forms.Label batteryLabel;
        private System.Windows.Forms.Label MCUIDLabel;
        private System.Windows.Forms.Label SignalReadyLabel;
        private System.Windows.Forms.Label ConnectionCheckLabel;
        private System.Windows.Forms.Label AuthenticationStatus;
        private System.Windows.Forms.PictureBox pictureBox1;
        private System.Windows.Forms.Label workloadLabel;
        private System.Windows.Forms.Label alphaLabel;
        private System.Windows.Forms.Label betaLabel;
        private System.Windows.Forms.Label thetaLabel;
        private System.Windows.Forms.Label gammaLabel;
        private System.Windows.Forms.CheckBox ARWCheckbox;
        private System.Windows.Forms.CheckBox ABDTCheckbox;
        private System.Windows.Forms.CheckBox EEG_Check;
        private System.Windows.Forms.Label deltaLabel;
        private System.Windows.Forms.Label MCUIDValue;
        private System.Windows.Forms.TextBox DevelopmentCodeBox;
        private System.Windows.Forms.Label label1;
        private System.Windows.Forms.Label BTEnabledLabel;
        private System.Windows.Forms.Label isBTEnabled;
        private System.Windows.Forms.Label label2;
        private System.Windows.Forms.TextBox OSCPortInput;
        private System.Windows.Forms.Button authButton;
        private System.Windows.Forms.Button RedButton;
        private System.Windows.Forms.Button GreenButton;
        private System.Windows.Forms.Button BlueButton;
        private System.Windows.Forms.Button CyanButton;
        private System.Windows.Forms.Button MagentaButton;
        private System.Windows.Forms.Button YellowButton;
        private System.Windows.Forms.Button StopRGBButton;
        private System.Windows.Forms.Button StartButton;
        private System.Windows.Forms.Button StopButton;
        private System.Windows.Forms.Button PPGStartButton;
        private System.Windows.Forms.Button PPGStopButton;
        private System.Windows.Forms.Label SPO2Label;
        private System.Windows.Forms.Label HeartRateLabel;
        private System.Windows.Forms.Label EvokeLabel;
        private System.Windows.Forms.Label XGainLabel;
        private System.Windows.Forms.Label YGainLabel;
        private System.Windows.Forms.Label ZGainLabel;
        private System.Windows.Forms.Label FWVERLabel;
        private System.Windows.Forms.Button FWVERButton;
        private System.Windows.Forms.Button EvokeButton;
        private System.Windows.Forms.Button CalStartButton;
        private System.Windows.Forms.Button CalStopButton;
        private System.Windows.Forms.Label DirectionLabel;
        private System.Windows.Forms.Label ImpedanceLabel;
        private System.Windows.Forms.Label PPGLabel;
        private System.Windows.Forms.Button DCButton;
        private System.Windows.Forms.Button ACbutton;
    }
}

