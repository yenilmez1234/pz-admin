import java.lang.reflect.Field;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import zombie.config.BooleanConfigOption;
import zombie.config.ConfigOption;
import zombie.config.DoubleConfigOption;
import zombie.config.IntegerConfigOption;
import zombie.config.StringConfigOption;
import zombie.core.Rand;
import zombie.network.ServerOptions;

public final class ExtractServerOptions {
    private static final Base64.Encoder BASE64 = Base64.getEncoder();

    private ExtractServerOptions() {}

    public static void main(String[] args) throws ReflectiveOperationException {
        // ServerPlayerID has a random default, so the game's option constructor
        // requires its normal random-number generator to be initialized.
        Rand.init();
        ServerOptions serverOptions = ServerOptions.instance;

        for (String name : serverOptions.getPublicOptions()) {
            ConfigOption option = serverOptions.getOptionByName(name).asConfigOption();
            Metadata metadata = metadata(option);
            System.out.printf(
                    "%s\t%s\t%s\t%s\t%s\t%s%n",
                    encode(name),
                    metadata.type,
                    encode(metadata.defaultValue),
                    number(metadata.minimum),
                    number(metadata.maximum),
                    number(metadata.maximumLength));
        }
    }

    private static Metadata metadata(ConfigOption option) throws ReflectiveOperationException {
        if (option instanceof BooleanConfigOption booleanOption) {
            return new Metadata(
                    "boolean",
                    Boolean.toString(booleanOption.getDefaultValue()),
                    null,
                    null,
                    null);
        }
        if (option instanceof IntegerConfigOption integerOption) {
            return new Metadata(
                    "integer",
                    Integer.toString(integerOption.getDefaultValue()),
                    integerOption.getMin(),
                    integerOption.getMax(),
                    null);
        }
        if (option instanceof DoubleConfigOption doubleOption) {
            return new Metadata(
                    "number",
                    Double.toString(doubleOption.getDefaultValue()),
                    doubleOption.getMin(),
                    doubleOption.getMax(),
                    null);
        }
        if (option instanceof StringConfigOption stringOption) {
            Field maximumLength = StringConfigOption.class.getDeclaredField("maxLength");
            maximumLength.setAccessible(true);
            String type = option instanceof ServerOptions.TextServerOption ? "text" : "string";
            return new Metadata(
                    type,
                    stringOption.getDefaultValue(),
                    null,
                    null,
                    maximumLength.getInt(stringOption));
        }
        throw new IllegalArgumentException(
                "Unsupported server option type: " + option.getClass().getName());
    }

    private static String encode(String value) {
        return BASE64.encodeToString(value.getBytes(StandardCharsets.UTF_8));
    }

    private static String number(Number value) {
        return value == null ? "-" : value.toString();
    }

    private record Metadata(
            String type,
            String defaultValue,
            Number minimum,
            Number maximum,
            Number maximumLength) {}
}
