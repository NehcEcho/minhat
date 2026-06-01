using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using NeeuroOSWindows;
using System.Diagnostics;
using System.Windows.Forms;
using System.Drawing;
using System.IO;
using SharpOSC;   // ← 新增：已包含在 lib/SharpOSC.dll

namespace NSB_SDK
{
    public partial class NSB_SDK
    {
        // ──────────────────────────────────────────────────────────────
        //  OSC 发送器（向 Python 训练/推理脚本发数据）
        // ──────────────────────────────────────────────────────────────
        private UDPSender oscSender;

        // 是否正在向 Python 发送 EEG 数据（可在 UI 中用 CheckBox 控制）
        private bool oscEnabled = true;

        private class authenticationCallBack : SenzeBandConnectInterface.deviceAuthenticationInterface
        {
            public Label authenticationText;
            public Form form;

            Timer authLogic = null;
            public void getAuthenticationResult(string device_address, string status, string message)
            {
                if (form.InvokeRequired)
                {
                    Action<string, string, string> func = getAuthenticationResult;
                    form.Invoke(func, new object[3] {device_address, status, message});
                    return;
                }

                authenticationText.Text = "Authentication: " + ((status == "200") ? "True" : message);

                if (authLogic != null) authLogic.Stop();

                if(status == "200")
                {
                    authLogic = new Timer();
                    authLogic.Interval = 1000;
                    authLogic.Tick += (object sender, EventArgs e) =>
                    {
                        long authperiod = DeviceAuthentication.instance.getAuthenticationValidityPeriod();
                        authenticationText.Text = "Authentication period: " + authperiod / 1000;
                        if (authperiod == 0) authLogic.Stop();
                    };
                    authLogic.Start();
                }
            }

            public void timeUp(object obj)
            {
                if (form.InvokeRequired)
                {
                    Action<object> func = timeUp;
                    form.Invoke(func, obj);
                    return;
                }
                authenticationText.Text = "Authentication Status: " + "Time up.";
            }

            public void pumpAuthenticationTextView(Label tv, Form f)
            {
                authenticationText = tv;
                form = f;
            }
        }

        void initialize()
        {
            // ── OSC 发送器初始化 ──────────────────────────────────────
            // 默认发到本机 Python 脚本，端口与 Python 侧 --port 保持一致
            InitOscSender("127.0.0.1", int.Parse(OSCPort));

            // Assigns the callback functions for retrieving data from SenzeBandWindowsDLL systems
            SenzeBandConnectInterface.getSBCIHandler().assignAccDelegate(grabAcceleration);
            SenzeBandConnectInterface.getSBCIHandler().assignAttentionDelegate(grabAttention);
            SenzeBandConnectInterface.getSBCIHandler().assignRelaxationDelegate(grabRelaxation);

            SenzeBandConnectInterface.getSBCIHandler().assignImpedanceDelegate(grabImpedance);
            SenzeBandConnectInterface.getSBCIHandler().assignPPGDataDelegate(grabPPGData);

            SenzeBandConnectInterface.getSBCIHandler().assignMentalWorkloadDelegate(grabWorkload);
            SenzeBandConnectInterface.getSBCIHandler().assignRawDataDelegate(grabRawEEG);
            SenzeBandConnectInterface.getSBCIHandler().assignRawData200msDelegate(grabRawEEG200ms);
            SenzeBandConnectInterface.getSBCIHandler().assignFilteredDataDelegate(grabFilteredEEG);
            SenzeBandConnectInterface.getSBCIHandler().assignABDTDelegate(grabABDT);
            SenzeBandConnectInterface.getSBCIHandler().assignMCUDelegate(grabMCU);
            SenzeBandConnectInterface.getSBCIHandler().assignBatteryDelegate(grabBattery);
            SenzeBandConnectInterface.getSBCIHandler().assignDirectionDelegate(grabDirection);
            SenzeBandConnectInterface.getSBCIHandler().assignEvokeDelegate(grabEvoke);
            SenzeBandConnectInterface.getSBCIHandler().assignCalParamsDelegate(grabCalParams);
            SenzeBandConnectInterface.getSBCIHandler().assignFWVERDelegate(grabFWVER);
            SenzeBandConnectInterface.getSBCIHandler().assignSPO2HeartRateDelegate(grabSPO2HeartRate);
            SenzeBandConnectInterface.getSBCIHandler().assignChannelDelegate(grabChannel);
            SenzeBandConnectInterface.getSBCIHandler().assignSignalReadyDelegate(grabSignalReady);
            SenzeBandConnectInterface.getSBCIHandler().assignConnectionCheckDelegate(grabConnectionCheck);

            var cb = new authenticationCallBack();
            cb.pumpAuthenticationTextView(this.AuthenticationStatus, this);
            DeviceAuthentication.instance.AssignAuthenticationStatusCallbacks(cb);
        }

        // ──────────────────────────────────────────────────────────────
        //  OSC 工具方法
        // ──────────────────────────────────────────────────────────────

        /// <summary>
        /// 初始化 OSC 发送器。如果端口改变（UI 中修改），调用本方法重建。
        /// </summary>
        private void InitOscSender(string ip, int port)
        {
            try
            {
                oscSender = new UDPSender(ip, port);
            }
            catch (Exception ex)
            {
                Debug.WriteLine("OSC 初始化失败: " + ex.Message);
                oscSender = null;
            }
        }

        /// <summary>
        /// 在后台线程批量发送 OSC 消息，避免阻塞 UI。
        ///
        /// Neeuro SDK 数据格式（来自官方手册）：
        ///   采样率 250Hz，BT 1Hz 传输，每包 4 通道 × 250 采样 = 1000 个 float。
        ///   数组按通道分组（channel-major）：
        ///     data[0..249]   = Channel 0 的 250 个采样点
        ///     data[250..499] = Channel 1 的 250 个采样点
        ///     data[500..749] = Channel 2 的 250 个采样点
        ///     data[750..999] = Channel 3 的 250 个采样点
        ///
        ///   每次发送 1 条 OSC 消息 /eeg/filtered ch0 ch1 ch2 ch3，
        ///   代表同一时刻 4 个通道的采样值。Python 侧按 250Hz 收到这些消息。
        /// </summary>
        private void SendFilteredEEGViaOSC(float[] data)
        {
            if (oscSender == null || !oscEnabled) return;
            if (data == null || data.Length < 4) return;

            // numSamples = 250（正常包）或其他值（200ms 包约 50）
            int numSamples = data.Length / 4;

            Task.Run(() =>
            {
                try
                {
                    for (int s = 0; s < numSamples; s++)
                    {
                        // Channel-major 布局：每个通道的采样点连续存储
                        float ch0 = data[s];
                        float ch1 = data[numSamples + s];
                        float ch2 = data[2 * numSamples + s];
                        float ch3 = data[3 * numSamples + s];

                        oscSender.Send(new OscMessage("/eeg/filtered",
                            ch0, ch1, ch2, ch3));
                    }
                }
                catch (Exception ex)
                {
                    Debug.WriteLine("OSC 发送出错: " + ex.Message);
                }
            });
        }

        // ──────────────────────────────────────────────────────────────
        //  原有回调（不变）
        // ──────────────────────────────────────────────────────────────

        void InsertDataPoint(List<float> data, float point)
        {
            if (data.Count < 30)
            {
                data.Clear();
                for (int i = 0; i < 30; ++i) data.Add(0.0f);
            }
            data.Add(point);
            if (data.Count > 30) data.RemoveAt(0);
        }

        void grabAcceleration(float[] acc)
        {
            if(InvokeRequired) { Action<float[]> f = grabAcceleration; Invoke(f, acc); return; }
            errorLog("grabAcceleration");
            accXLabel.Text = "Acc X: " + acc[0];
            accYLabel.Text = "Acc Y: " + acc[1];
            accZLabel.Text = "Acc Z: " + acc[2];
        }

        List<float> att_data = new List<float>();
        void grabAttention(float attention)
        {
            if (InvokeRequired) { Action<float> f = grabAttention; Invoke(f, attention); return; }
            errorLog("grabAttention");
            InsertDataPoint(att_data, attention);
            if (ARWCheckbox.Checked) grapher.UpdateData(Pens.Red, att_data);
            attentionLabel.Text = "Attention: " + attention;
        }

        List<float> rel_data = new List<float>();
        void grabRelaxation(float relaxation)
        {
            if (InvokeRequired) { Action<float> f = grabRelaxation; Invoke(f, relaxation); return; }
            errorLog("grabRelaxation");
            InsertDataPoint(rel_data, relaxation);
            if (ARWCheckbox.Checked) grapher.UpdateData(Pens.Green, rel_data);
            relaxationLabel.Text = "Relaxation: " + relaxation;
        }

        List<float> wor_data = new List<float>();
        void grabWorkload(float workload)
        {
            if (InvokeRequired) { Action<float> f = grabWorkload; Invoke(f, workload); return; }
            errorLog("grabWorkload");
            InsertDataPoint(wor_data, workload);
            if (ARWCheckbox.Checked)
            {
                grapher.UpdateData(Pens.Blue, wor_data);
                grapher.SignalDataReadyForDraw();
            }
            workloadLabel.Text = "Workload: " + workload;
        }

        void grabPPGData(int[] data)
        {
            if (InvokeRequired) { Action<int[]> f = grabPPGData; Invoke(f, data); return; }
            PPGLabel.Text = "PPG: " + data[0] + " " + data[1];
        }

        void grabImpedance(float[] data)
        {
            if (InvokeRequired) { Action<float[]> f = grabImpedance; Invoke(f, data); return; }
            ImpedanceLabel.Text = "Impedance: " + data[0] + " " + data[1] + " " + data[2] + " " + data[3];
        }

        List<float> eeg_data = new List<float>();

        const int rawDataFileLines = 5;
        List<string> rawDataFileBuffer = new List<string>();
        const int rawData200msFileLines = 5 * rawDataFileLines;
        List<string> rawData200msFileBuffer = new List<string>();

        string arrayToString(int[] data) => DateTime.Now.ToString("s") + "," + string.Join(",", data);
        string arrayToString(float[] data) => DateTime.Now.ToString("s") + "," + string.Join(",", data);

        void grabRawEEG(int[] data)
        {
            if (InvokeRequired) { Action<int[]> f = grabRawEEG; Invoke(f, data); return; }
            errorLog("grabRawEEG");
            // Raw EEG 不通过 OSC 发送（使用 Filtered 版本）
        }

        void grabRawEEG200ms(float[] data)
        {
            if (InvokeRequired) { Action<float[]> f = grabRawEEG200ms; Invoke(f, data); return; }
            errorLog("grabRawEEG200ms " + data[0]);
        }

        // ── 核心：Filtered EEG → OSC → Python ────────────────────────
        void grabFilteredEEG(float[] data)
        {
            if (InvokeRequired) { Action<float[]> f = grabFilteredEEG; Invoke(f, data); return; }
            errorLog("grabFilteredEEG: " + data[0]);

            // 1. 原有可视化（不变）
            if (EEG_Check.Checked)
            {
                eeg_data = new List<float>(data);
                grapher.UpdateData(Pens.Gray, eeg_data, true);
                grapher.SignalDataReadyForDraw();
            }

            // 2. 发送给 Python（新增）
            //    Python collect_eeg_dataset.py 或 ShoujiShuJu.py 在另一端监听
            SendFilteredEEGViaOSC(data);
        }

        List<float> delta_data = new List<float>();
        List<float> theta_data = new List<float>();
        List<float> alpha_data = new List<float>();
        List<float> beta_data  = new List<float>();
        List<float> gamma_data = new List<float>();
        void grabABDT(float[,] data)
        {
            if (InvokeRequired) { Action<float[,]> f = grabABDT; Invoke(f, data); return; }
            errorLog("grabABDT");
            InsertDataPoint(delta_data, EEGUtils.GetABDTValue(data, EEGUtils.ABDT.DELTA));
            InsertDataPoint(theta_data, EEGUtils.GetABDTValue(data, EEGUtils.ABDT.THETA));
            InsertDataPoint(alpha_data, EEGUtils.GetABDTValue(data, EEGUtils.ABDT.ALPHA));
            InsertDataPoint(beta_data,  EEGUtils.GetABDTValue(data, EEGUtils.ABDT.BETA));
            InsertDataPoint(gamma_data, EEGUtils.GetABDTValue(data, EEGUtils.ABDT.GAMMA));
            if (ABDTCheckbox.Checked)
            {
                grapher.UpdateData(Pens.Red,    delta_data, true);
                grapher.UpdateData(Pens.Green,  theta_data, true);
                grapher.UpdateData(Pens.Blue,   alpha_data, true);
                grapher.UpdateData(Pens.Orange, beta_data,  true);
                grapher.UpdateData(Pens.Purple, gamma_data, true);
                grapher.SignalDataReadyForDraw();
            }
        }

        void grabCalParams(float[] data)
        {
            if (InvokeRequired) { Action<float[]> f = grabCalParams; Invoke(f, data); return; }
            errorLog("grabCalParams " + data[0] + " " + data[1] + " " + data[2]);
            XGainLabel.Text = "XGain: " + data[0];
            YGainLabel.Text = "YGain: " + data[1];
            ZGainLabel.Text = "ZGain: " + data[2];
        }

        void ClearCachedEEGData()
        {
            att_data.Clear(); rel_data.Clear(); wor_data.Clear();
            delta_data.Clear(); theta_data.Clear(); alpha_data.Clear();
            beta_data.Clear(); gamma_data.Clear();
        }

        void grabMCU(string mcuID)
        {
            if (InvokeRequired) { Action<string> f = grabMCU; Invoke(f, mcuID); return; }
            errorLog("grabMCU");
            MCUIDValue.Text = mcuID;
        }

        void grabFWVER(string fwver)
        {
            if (InvokeRequired) { Action<string> f = grabFWVER; Invoke(f, fwver); return; }
            errorLog("grabFWVER");
            FWVERLabel.Text = "FWVER: " + fwver;
        }

        void grabBattery(string battery)
        {
            if (InvokeRequired) { Action<string> f = grabBattery; Invoke(f, battery); return; }
            errorLog("grabBattery");
            batteryLabel.Text = "Battery: " + battery + "%";
        }

        void grabDirection(string direction)
        {
            if (InvokeRequired) { Action<string> f = grabDirection; Invoke(f, direction); return; }
            errorLog("grabDirection direction=" + direction);
            DirectionLabel.Text = "Direction: " + direction;
        }

        void grabEvoke(int evokeMilli)
        {
            if (InvokeRequired) { Action<int> f = grabEvoke; Invoke(f, evokeMilli); return; }
            errorLog("grabEvoke " + evokeMilli);
            EvokeLabel.Text = "Evoke: " + evokeMilli;
        }

        void grabSPO2HeartRate(int[] data)
        {
            if (InvokeRequired) { Action<int[]> f = grabSPO2HeartRate; Invoke(f, data); return; }
            errorLog("grabSPO2HeartRate");
            SPO2Label.Text = "SPO2: " + data[0];
            HeartRateLabel.Text = "Heart Rate: " + data[1];
        }

        void grabChannel(bool[] channel)
        {
            if (InvokeRequired) { Action<bool[]> f = grabChannel; Invoke(f, channel); return; }
            errorLog("grabChannel");
            channel1Label.Text = "Channel 1: " + channel[0].ToString();
            channel2Label.Text = "Channel 2: " + channel[1].ToString();
            channel3Label.Text = "Channel 3: " + channel[2].ToString();
            channel4Label.Text = "Channel 4: " + channel[3].ToString();
        }

        void grabConnectionCheck(bool connectionCheck)
        {
            if (InvokeRequired) { Action<bool> f = grabConnectionCheck; Invoke(f, connectionCheck); return; }
            errorLog("grabConnectionCheck");
            ConnectionCheckLabel.Text = connectionCheck
                ? "Connection Check: Good"
                : "Connection Check: Data Loss";
        }

        void grabSignalReady(bool signalReady)
        {
            if (InvokeRequired) { Action<bool> f = grabSignalReady; Invoke(f, signalReady); return; }
            errorLog("grabSignalReady");
            SignalReadyLabel.Text = "Signal Ready: " + signalReady.ToString();
        }

        private void CheckEnterKeyPress(object sender, KeyPressEventArgs e)
        {
            if (e.KeyChar == (char)Keys.Return) SetDevcode(DevelopmentCodeBox.Text);
        }

        public static string OSCPort = "4545";
        private void OSCPortInput_TextChanged(object sender, EventArgs e)
        {
            OSCPort = OSCPortInput.Text;
            // 端口改变时重建 OSC 发送器
            if (int.TryParse(OSCPort, out int port))
                InitOscSender("127.0.0.1", port);
        }
    }
}

static public class Utils
{
    public static IEnumerable<T> SliceRow<T>(this T[,] array, int row)
    {
        for (var i = array.GetLowerBound(1); i <= array.GetUpperBound(1); i++)
            yield return array[row, i];
    }

    public static IEnumerable<T> SliceColumn<T>(this T[,] array, int column)
    {
        for (var i = array.GetLowerBound(0); i <= array.GetUpperBound(0); i++)
            yield return array[i, column];
    }
}
