using System;
using System.Collections.Generic;
using System.Drawing;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Windows.Forms;

public class EEGGrapher
{
    public Control control;

    Dictionary<Pen, List<float>> eeg_data = new Dictionary<Pen, List<float>>();
    public void UpdateData(Pen p, List<float> d, bool normalize = false)
    {
        if(normalize)
        {
            d = Normalize(d);
        }

        if(eeg_data.ContainsKey(p))
        {
            eeg_data[p] = d;
        }
        else
            eeg_data.Add(p, d);
    }

    List<float> Normalize(List<float> data)
    {
        if(data == null || data.Count < 1) return data;

        List<float> ret = new List<float>();

        float max_magnitude = float.MinValue;
        bool negatives = false;

        foreach(var d in data)
        {
            float m = ( d * ( (d < 0.0f) ? -1.0f : 1.0f ) );

            if(m > max_magnitude) max_magnitude = m;

            if(negatives == false && d < 0.0f) negatives = true;
        }

        if(max_magnitude == 0.0f) // do not divide by 0
            return data;

        foreach(var d in data)
        {
            float val = d / max_magnitude;

            if (negatives == false)
                ret.Add(val);
            else
                ret.Add((val + 1.0f) / 2.0f);
        }

        return ret;
    }

    internal void Draw(PaintEventArgs e)
    {        
        foreach(var dataset in eeg_data)
        {
            DrawDataset(e, dataset.Value, dataset.Key);
        }
    }

    public void ClearAllData()
    {
        eeg_data.Clear();        
    }

    public void SignalDataReadyForDraw()
    {
        control.Invalidate();
    }

    void DrawDataset(PaintEventArgs e, List<float> data, Pen p)
    {
        if(data == null || data.Count < 1) return;

        float deltaX = (float)control.Width / (float)data.Count;
        float currX = 0.0f;
        int count = 0;

        bool first = true;
        Point last = new Point(0, control.Height);
        foreach (var d in data)
        {
            currX = deltaX * count++;

            Point here = new Point((int)currX, (int)(control.Height * (1.0f - d)));

            if(first == false) e.Graphics.DrawLine(p, last, here);

            first = false;
            last = here;
        }
    }
}

public class EEGUtils
{
    public enum ABDT
    {
        DELTA,
        THETA,
        ALPHA,
        BETA,
        GAMMA
    }
    public static float GetABDTValue(float[,] data, ABDT abdt)
    {
        return data[1, (int)abdt];
    }    
}