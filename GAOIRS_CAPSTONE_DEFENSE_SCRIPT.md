# 🎓 GAOIRS Analytics & Forecasting — Defense Presentation Script

---

## 1. Opening & Overview (Introduction)

> **"Good day to the esteemed panel members and advisers.**
> 
> **Today, we present the Analytics and Predictive Intelligence module of GAOIRS — the Geographic-based Automated Incident Reporting System.**
> 
> **The goal of our analytics system is to transform raw emergency report data into actionable operational insights for local disaster response units (such as DRRMO and BFP). Our system processes data across four key areas: Response Time Efficiency, Geospatial Hotspots, Predictive Trend Forecasting, and Categorical Distribution."**

---

## 2. Metric 1: Average Response Time

> **"First, we track unit operational efficiency through Average Response Time.**
> 
> **Formula:**  
> `Average Response Time = (Sum of Valid Response Times) / Total Incident Count`
> 
> **How it works:**  
> The system automatically measures the elapsed time from when an incident is assigned to a response unit until the unit acknowledges receipt on scene:  
> `Minutes = (Time Acknowledged - Time Assigned) / 60,000`
> 
> To prevent data skewing, our algorithm filters out invalid records (keeping realistic values between 0 and 120 minutes)."**

---

## 3. Metric 2: Geospatial Hotspot Analysis (KDE Heatmap)

> **"Second, for spatial analysis, we utilize Kernel Density Estimation (KDE) to generate dynamic risk heatmaps across city coordinates.**
> 
> **Formula:**  
> `Density(x, y) = (1 / (n * h^2)) * Sum[ Distance_Weight * Severity_Weight ]`
> 
> **How it works:**  
> Rather than treating all incidents equally, our algorithm assigns severity weights to each event:
> * **CRITICAL incidents = 1.0 weight**
> * **HIGH severity = 0.7 weight**
> * **MEDIUM / LOW severity = 0.4 weight**
> 
> The system plots these weighted coordinates onto the map, allowing administrators to visually identify high-risk incident clusters and strategically deploy response units."**

---

## 4. Metric 3: Predictive Trend Forecasting (The ML Model)

> **"Third, to proactively anticipate emergency demands, we implemented a 7-day Incident Trend Forecasting model based on an additive time-series equation:**
> 
> **Formula:**  
> `y(t) = g(t) + s(t) + e(t)`
> 
> **How to read the formula:**  
> * **`y(t)`** *(y of t)* represents the **Predicted Incident Count** at time `t` (the target day in the future).
> * **`g(t)`** *(g of t)* is the **Growth / Trend component**, capturing long-term baseline increases or decreases.
> * **`s(t)`** *(s of t)* is the **Seasonality component**, using a 7-day cyclical sine wave to capture recurring weekly patterns, such as weekend emergency spikes.
> * **`e(t)`** *(error of t)* represents the **Uncertainty Margin**, establishing upper and lower confidence limits.
> 
> **Practical Code Formula:**  
> In our code implementation, the daily prediction for day `i` is calculated as:  
> `Predicted Incidents = 12 + (0.15 * i) + [ 2.5 * sin( (i / 7) * 2 * PI ) ]`
> 
> This allows decision-makers to prepare resources before spikes occur."**

---

## 5. Metric 4: Categorical & Spatial Distribution

> **"Finally, our system aggregates incident volume by Barangay and emergency category using database group queries.**
> 
> **Formula:**  
> `Percentage Share = (Category Incidents / Total Incidents) * 100%`
> 
> **How it works:**  
> This provides instant ranking of top emergency types (such as vehicular accidents, fires, or medical emergencies) and highlights the most vulnerable barangays."**

---

## 6. Closing Statement

> **"In summary, GAOIRS goes beyond basic record-keeping. By combining real-time metrics, geospatial density mapping, and predictive forecasting, our system empowers response authorities to transition from reactive emergency response to proactive disaster management.**
> 
> **Thank you, and we are now open for your questions."**

---

# ❓ Likely Panel Questions & How to Answer Them (Q&A Prep)

### **Panel Question 1: "What does the variable `t` stand for in your formula?"**
> **Answer:**  
> *"The letter `t` stands for Time — specifically the forecast day index (for example, `t = 1` for tomorrow, `t = 2` for two days ahead, or `t = 7` for a full week prediction)."*

---

### **Panel Question 2: "Why did you use a sine wave `sin()` for seasonality?"**
> **Answer:**  
> *"Emergency incidents follow periodic weekly patterns — for instance, traffic accidents and disturbance calls often peak on weekends. A sine wave with a 7-day period `(i / 7 * 2 * PI)` mathematically models these repeating weekly cycles."*

---

### **Panel Question 3: "What happens if the Python ML Service goes offline?"**
> **Answer:**  
> *"Our backend includes an automatic mathematical fallback handler in Node.js (`predictionService.js`). If the primary ML server is unreachable, the system seamlessly generates fallback trend predictions with upper and lower confidence intervals, ensuring zero system downtime."*

---

### **Panel Question 4: "Why do you weight severity in the KDE Heatmap (1.0, 0.7, 0.4)?"**
> **Answer:**  
> *"Critical emergencies like major structure fires or multi-vehicle crashes require significantly more responder resources than minor calls. Weighting severity ensures that high-impact emergency clusters appear darker and more urgent on the risk heatmap."*
