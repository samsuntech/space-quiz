# Orbit

Orbit은 우주 탐험을 주제로 한 영어 퀴즈 앱입니다. 10개의 4지선다 문제를 풀면서
정답과 해설을 확인하고, 마지막에 점수와 정확도를 볼 수 있습니다.
키보드 탐색, 좁은 화면, 다크 모드 및 모션 감소 설정을 지원합니다.

## 로컬 실행

저장소를 복제한 뒤 `index.html`을 웹 브라우저에서 여세요. macOS에서는 프로젝트
루트에서 다음 명령을 실행할 수 있습니다.

```sh
open index.html
```

앱은 HTML, CSS, JavaScript가 포함된 단일 정적 파일로 동작합니다. 패키지 설치,
빌드, 서버 또는 환경 변수 설정이 필요하지 않으며 외부 리소스를 요청하지 않습니다.
퀴즈 상태는 메모리에만 저장되므로 새로고침하면 초기화됩니다.

## GitHub Pages

사이트 주소: https://samsuntech.github.io/space-quiz/

저장소의 **Settings > Pages > Build and deployment > Source**는
**GitHub Actions**로 설정합니다.

`.github/workflows/pages.yml`은 PR에서 `index.html`이 비어 있지 않은지 확인하고
게시용 아티팩트를 준비합니다. `main` 브랜치에 변경 사항이 푸시되면 같은 파일을
GitHub Pages에 배포합니다. Actions의 **Deploy GitHub Pages** 워크플로에서
수동으로 배포를 실행할 수도 있습니다. 별도 컴파일 과정은 없으며, README나
저장소 설정 파일은 사이트에 포함하지 않습니다.
