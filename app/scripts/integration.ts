import { App } from 'electron';
import path from 'path';
import fs from 'fs';

const loginUrls = {
  mapillary: `https://www.mapillary.com/connect?client_id=${process.env.MAPILLARY_APP_ID}&response_type=token&scope=user:email%20private:upload&redirect_uri=${process.env.MAPILLARY_REDIRECT_URI}`,
  mtp: `${process.env.MTP_WEB_AUTH_URL}?client_id=${process.env.MTP_WEB_APP_ID}&response_type=token`,
};

export default async function loadIntegrations(app: App | null) {
  if (
    !(
      process.env.MTP_WEB_APP_ID &&
      process.env.MTP_WEB_APP_SECRET &&
      process.env.MTP_WEB_URL &&
      process.env.MTP_WEB_AUTH_URL
    )
  )
    return {};

  const integrationsRootPath = path.resolve(
    app?.getAppPath(),
    '../integrations'
  );

  const moduleIconPath = 'module-icon.png';
  const moduleConfigPath = 'module.json';

  const modules = await Promise.all(
    fs
      .readdirSync(integrationsRootPath)
      .filter(
        (name) =>
          fs.lstatSync(path.join(integrationsRootPath, name)).isDirectory() &&
          fs.existsSync(
            path.join(integrationsRootPath, name, 'static', moduleIconPath)
          ) &&
          path.join(integrationsRootPath, name, moduleConfigPath)
      )
      .map(async (m: string) => {
        const config = JSON.parse(
          fs
            .readFileSync(path.join(integrationsRootPath, m, moduleConfigPath))
            .toString()
        );

        const settings = {
          name: config.name,
          loginUrl: loginUrls[m],
        };

        return {
          [m]: {
            logo: fs
              .readFileSync(
                path.resolve(integrationsRootPath, m, 'static', moduleIconPath)
              )
              .toString('base64'),
            ...settings,
          },
        };
      })
  );

  return modules.reduce((obj, module: any) => {
    const key = Object.keys(module)[0];
    obj[key] = module[key];
    return obj;
  }, {});
}