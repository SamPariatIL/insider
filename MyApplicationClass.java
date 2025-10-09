import android.app.Application;
import android.util.Log;

import com.useinsider.insider.Insider;

public class MyApplicationClass extends Application {

    @Override
    public void onCreate() {
        super.onCreate();

        // Initialize Insider SDK
        Insider.Instance.init(this, "mataharistore");

        // Optional: Set log to confirm initialization
        Log.d("MyApplicationClass", "✅ Insider SDK initialized in Application class");
    }
}